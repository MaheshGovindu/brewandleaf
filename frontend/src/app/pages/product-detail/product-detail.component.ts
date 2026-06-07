import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Product } from '../../models/brew-and-leaf.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  activeIndex = 0;

  constructor(private route: ActivatedRoute, public api: ApiService, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.api.getProductById(id).subscribe(p => {
      this.product = p;
      this.activeIndex = 0;

      this.api.getProducts().subscribe(products => {
        this.relatedProducts = products
          .filter(item => item.id !== p.id && item.sub_category_id === p.sub_category_id)
          .slice(0, 4);
      });
    }, () => this.router.navigate(['/']));
  }

  prev() {
    if (!this.product) return;
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
  }

  next() {
    if (!this.product) return;
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
  }

  get images(): string[] {
    if (!this.product) return [];
    // prefer `images` array, fallback to single image_url
    return (this.product as any).images && (this.product as any).images.length ? (this.product as any).images : (this.product.image_url ? [this.product.image_url] : []);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
