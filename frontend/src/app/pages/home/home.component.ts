import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Banner, Category, Product, SubCategory } from '../../models/brew-and-leaf.models';
import { RouterLink } from '@angular/router';

interface MenuGroup {
  subCategory: SubCategory;
  products: Product[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  banners: Banner[] = [];
  featuredProducts: Product[] = [];
  menuGroups: MenuGroup[] = [];
  bannerIndex = 0;
  bannerInterval: any;

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    this.loadMenu();
    this.startBannerRotation();
  }

  startBannerRotation(): void {
    this.bannerInterval = setInterval(() => {
      if (this.activeBanners.length > 0) {
        this.bannerIndex = (this.bannerIndex + 1) % this.activeBanners.length;
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }

  get activeBanners(): Banner[] {
    return this.banners.filter(banner => banner.is_active !== false);
  }

  get currentBanner(): Banner | null {
    return this.activeBanners.length ? this.activeBanners[this.bannerIndex] : null;
  }

  goToBanner(index: number): void {
    this.bannerIndex = index;
  }

  loadBanners(): void {
    this.apiService.getBanners().subscribe(data => {
      this.banners = data;
      if (this.bannerIndex >= this.activeBanners.length) {
        this.bannerIndex = 0;
      }
    });
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe(data => this.categories = data);
  }

  loadMenu(): void {
    this.apiService.getSubCategories().subscribe(subCategories => {
      this.subCategories = [...subCategories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      this.apiService.getProducts().subscribe(products => {
        this.products = products;
        this.featuredProducts = products.filter(product => product.is_featured).slice(0, 8);
        if (!this.featuredProducts.length) {
          this.featuredProducts = products.slice(0, 8);
        }
        this.menuGroups = this.subCategories
          .map(subCategory => ({
            subCategory,
            products: products.filter(product => product.sub_category_id === subCategory.id)
          }))
          .filter(group => group.products.length > 0);
      });
    });
  }
}
