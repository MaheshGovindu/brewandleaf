import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, SubCategory, Product, Order, Stats } from '../models/brew-and-leaf.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api/brewandleaf';
  private backendUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  getFullImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) {
      return 'assets/img/placeholder.png';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return `${this.backendUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  uploadInvoice(formData: FormData) {
    // Upload invoice PDF to backend uploads folder and return { url }
    return this.http.post<{url: string}>(`${this.backendUrl}/api/brewandleaf/upload-invoice`, formData);
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: Category): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  // Sub-Categories
  getSubCategories(): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.apiUrl}/sub-categories`);
  }

  addSubCategory(subCategory: SubCategory): Observable<SubCategory> {
    return this.http.post<SubCategory>(`${this.apiUrl}/sub-categories`, subCategory);
  }

  updateSubCategory(id: number, subCategory: SubCategory): Observable<any> {
    return this.http.put(`${this.apiUrl}/sub-categories/${id}`, subCategory);
  }

  deleteSubCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sub-categories/${id}`);
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  addProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, formData);
  }

  updateProduct(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, formData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  // Orders
  createOrder(order: Order): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, order);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  // Stats
  getSummaryStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.apiUrl}/stats/summary`);
  }

  getDailyStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats/daily`);
  }

  // Auth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
}
