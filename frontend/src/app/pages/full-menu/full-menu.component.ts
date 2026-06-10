import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Product, Category, SubCategory } from '../../models/brew-and-leaf.models';

@Component({
  selector: 'app-full-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './full-menu.component.html',
  styleUrls: ['./full-menu.component.scss']
})
export class FullMenuComponent implements OnInit {
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  products: Product[] = [];
  
  drinksMenu: any[] = [];
  foodMenu: any[] = [];

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMenuData();
  }

  loadMenuData(): void {
    this.apiService.getCategories().subscribe(categories => {
      this.categories = categories;
      
      this.apiService.getSubCategories().subscribe(subs => {
        this.subCategories = subs;
        
        this.apiService.getProducts().subscribe(products => {
          this.products = products;
          this.organizeMenu();
        });
      });
    });
  }

  organizeMenu(): void {
    // Assuming category 1 is Drinks and 2 is Food based on common cafe structure
    // Or we can filter by category name if available
    const drinkCat = this.categories.find(c => c.name.toLowerCase().includes('drink') || c.name.toLowerCase().includes('beverage'));
    const foodCat = this.categories.find(c => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('eat'));

    if (drinkCat) {
      this.drinksMenu = this.subCategories
        .filter(s => s.category_id === drinkCat.id)
        .map(s => ({
          name: s.name,
          products: this.products.filter(p => p.sub_category_id === s.id)
        }))
        .filter(g => g.products.length > 0);
    }

    if (foodCat) {
      this.foodMenu = this.subCategories
        .filter(s => s.category_id === foodCat.id)
        .map(s => ({
          name: s.name,
          products: this.products.filter(p => p.sub_category_id === s.id)
        }))
        .filter(g => g.products.length > 0);
    }
    
    // Fallback if categories are not named as expected
    if (this.drinksMenu.length === 0 && this.foodMenu.length === 0) {
      const half = Math.ceil(this.subCategories.length / 2);
      this.drinksMenu = this.subCategories.slice(0, half).map(s => ({
        name: s.name,
        products: this.products.filter(p => p.sub_category_id === s.id)
      })).filter(g => g.products.length > 0);
      
      this.foodMenu = this.subCategories.slice(half).map(s => ({
        name: s.name,
        products: this.products.filter(p => p.sub_category_id === s.id)
      })).filter(g => g.products.length > 0);
    }
  }
}
