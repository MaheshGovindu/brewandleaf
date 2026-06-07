import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Product, Category, SubCategory, ProductSize } from '../../models/brew-and-leaf.models';

interface SizeFormValue {
  price: number;
  costing: number;
  id?: number;
}

@Component({
  selector: 'app-product-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-mgmt.component.html',
  styleUrls: ['./product-mgmt.component.scss']
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  subCategories: SubCategory[] = [];

  newProduct: Product = {
    category_id: 0,
    name: '',
    price: 0,
    costing: 0,
    discount: 0,
    inventory_count: 0,
    aspect_ratio: '1:1'
  };

  hasSizeVariants = false;
  smallSize: SizeFormValue = { price: 0, costing: 0 };
  regularSize: SizeFormValue = { price: 0, costing: 0 };

  selectedFile: File | null = null;
  selectedFiles: File[] = [];
  showModal = false;
  isEditing = false;

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getProducts().subscribe(data => this.products = data);
    this.apiService.getCategories().subscribe(data => this.categories = data);
    this.apiService.getSubCategories().subscribe(data => this.subCategories = data);
  }

  get availableSubCategories(): SubCategory[] {
    if (!this.newProduct.category_id) {
      return this.subCategories;
    }

    return this.subCategories.filter(subCategory => subCategory.category_id === +this.newProduct.category_id);
  }

  getPriceDisplay(prod: Product): string {
    if (prod.sizes && prod.sizes.length > 0) {
      const small = prod.sizes.find(s => s.size.toLowerCase() === 'small');
      const regular = prod.sizes.find(s => s.size.toLowerCase() === 'regular');
      const parts: string[] = [];
      if (small) parts.push(`S: ₹${Number(small.price).toFixed(0)}`);
      if (regular) parts.push(`R: ₹${Number(regular.price).toFixed(0)}`);
      return parts.length ? parts.join(' · ') : `₹${Number(prod.price).toFixed(0)}`;
    }
    return `₹${Number(prod.price).toFixed(0)}`;
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length) {
      this.selectedFiles = Array.from(files);
      this.selectedFile = this.selectedFiles[0];
    } else {
      this.selectedFiles = [];
      this.selectedFile = null;
    }
  }

  onSizeVariantsToggle(): void {
    if (this.hasSizeVariants) {
      this.regularSize.price = this.newProduct.price;
      this.regularSize.costing = this.newProduct.costing;
    }
  }

  saveProduct(): void {
    if (this.hasSizeVariants) {
      this.newProduct.price = this.regularSize.price || this.newProduct.price;
      this.newProduct.costing = this.regularSize.costing || this.newProduct.costing;
    }

    const formData = new FormData();
    Object.keys(this.newProduct).forEach(key => {
      const value = (this.newProduct as any)[key];
      if (value !== null && value !== undefined && key !== 'sizes') {
        formData.append(key, value);
      }
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    if (this.isEditing && this.newProduct.id) {
      this.apiService.updateProduct(this.newProduct.id, formData).subscribe(() => {
        this.syncProductSizes(this.newProduct.id!).subscribe(() => {
          this.loadData();
          this.closeModal();
        });
      });
      return;
    }

    this.apiService.addProduct(formData).subscribe((res: any) => {
      const id = res && res.id ? res.id : null;
      const afterSizes = () => {
        if (id && this.selectedFiles && this.selectedFiles.length > 1) {
          const imgs = new FormData();
          this.selectedFiles.slice(1).forEach(f => imgs.append('images', f));
          this.apiService.uploadProductImages(id, imgs).subscribe(() => {
            this.loadData();
            this.closeModal();
          }, () => {
            this.loadData();
            this.closeModal();
          });
        } else {
          this.loadData();
          this.closeModal();
        }
      };

      if (id) {
        this.syncProductSizes(id).subscribe(() => afterSizes());
      } else {
        afterSizes();
      }
    });
  }

  private syncProductSizes(productId: number): Observable<void> {
    if (!this.hasSizeVariants) {
      const existingSizes = this.newProduct.sizes || [];
      if (!existingSizes.length) {
        return of(undefined);
      }
      return forkJoin(existingSizes.map(size =>
        this.apiService.deleteProductSize(productId, size.id!)
      )).pipe(map(() => undefined));
    }

    const requests = [
      this.upsertSize(productId, 'small', this.smallSize),
      this.upsertSize(productId, 'regular', this.regularSize)
    ];

    return forkJoin(requests).pipe(map(() => undefined));
  }

  private upsertSize(productId: number, sizeName: string, formValue: SizeFormValue) {
    const payload: ProductSize = {
      size: sizeName,
      price: Number(formValue.price) || 0,
      costing: Number(formValue.costing) || 0
    };

    if (formValue.id) {
      return this.apiService.updateProductSize(productId, formValue.id, payload);
    }

    return this.apiService.addProductSize(productId, payload);
  }

  editProduct(prod: Product): void {
    this.newProduct = { ...prod };
    this.isEditing = true;
    this.showModal = true;
    this.loadSizeFields(prod);
  }

  private loadSizeFields(prod: Product): void {
    const sizes = prod.sizes || [];
    const small = sizes.find(s => s.size.toLowerCase() === 'small');
    const regular = sizes.find(s => s.size.toLowerCase() === 'regular');

    this.hasSizeVariants = sizes.length > 0;
    this.smallSize = {
      id: small?.id,
      price: small ? Number(small.price) : 0,
      costing: small ? Number(small.costing || 0) : 0
    };
    this.regularSize = {
      id: regular?.id,
      price: regular ? Number(regular.price) : Number(prod.price) || 0,
      costing: regular ? Number(regular.costing || 0) : Number(prod.costing) || 0
    };
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteProduct(id).subscribe(() => this.loadData());
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newProduct = {
      category_id: 0,
      name: '',
      price: 0,
      costing: 0,
      discount: 0,
      inventory_count: 0,
      aspect_ratio: '1:1'
    };
    this.hasSizeVariants = false;
    this.smallSize = { price: 0, costing: 0 };
    this.regularSize = { price: 0, costing: 0 };
    this.selectedFile = null;
    this.selectedFiles = [];
  }
}
