import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, Category, SubCategory } from '../../models/brew-and-leaf.models';

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

    return this.subCategories.filter(subCategory => subCategory.category_id === this.newProduct.category_id);
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

  saveProduct(): void {
    const formData = new FormData();
    Object.keys(this.newProduct).forEach(key => {
        if ((this.newProduct as any)[key] !== null && (this.newProduct as any)[key] !== undefined) {
            formData.append(key, (this.newProduct as any)[key]);
        }
    });
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }


    if (this.isEditing && this.newProduct.id) {
        this.apiService.updateProduct(this.newProduct.id, formData).subscribe(() => {
            this.loadData();
            this.closeModal();
        });
    } else {
        this.apiService.addProduct(formData).subscribe((res: any) => {
            const id = res && res.id ? res.id : null;
            if (id && this.selectedFiles && this.selectedFiles.length > 0) {
              const imgs = new FormData();
              this.selectedFiles.forEach(f => imgs.append('images', f));
              this.apiService.uploadProductImages(id, imgs).subscribe(() => {
                this.loadData();
                this.closeModal();
              }, () => { this.loadData(); this.closeModal(); });
            } else {
              this.loadData();
              this.closeModal();
            }
        });
    }
  }

  editProduct(prod: Product): void {
    this.newProduct = { ...prod };
    this.isEditing = true;
    this.showModal = true;
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
    this.selectedFile = null;
    this.selectedFiles = [];
  }
}
