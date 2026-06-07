import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Banner, Category, SubCategory, Product, ProductSize, Order, Stats } from '../models/brew-and-leaf.models';
import { StoreDataService } from './store-data.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api/brewandleaf';
  private backendUrl = 'http://localhost:5000';

  constructor(private http: HttpClient, private storeData: StoreDataService) { }

  getFullImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) {
      return 'assets/img/placeholder.png';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
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
    return this.http.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      catchError(() => of(this.storeData.getCategories()))
    );
  }

  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category).pipe(
      catchError(() => of(this.storeData.saveCategory(category)))
    );
  }

  updateCategory(id: number, category: Category): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, category).pipe(
      catchError(() => of(this.storeData.saveCategory({ ...category, id })))
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`).pipe(
      catchError(() => {
        this.storeData.deleteCategory(id);
        return of({ success: true });
      })
    );
  }

  // Sub-Categories
  getSubCategories(): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.apiUrl}/sub-categories`).pipe(
      catchError(() => of(this.storeData.getSubCategories()))
    );
  }

  addSubCategory(subCategory: SubCategory): Observable<SubCategory> {
    return this.http.post<SubCategory>(`${this.apiUrl}/sub-categories`, subCategory).pipe(
      catchError(() => of(this.storeData.saveSubCategory(subCategory)))
    );
  }

  updateSubCategory(id: number, subCategory: SubCategory): Observable<any> {
    return this.http.put(`${this.apiUrl}/sub-categories/${id}`, subCategory).pipe(
      catchError(() => of(this.storeData.saveSubCategory({ ...subCategory, id })))
    );
  }

  deleteSubCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sub-categories/${id}`).pipe(
      catchError(() => {
        this.storeData.deleteSubCategory(id);
        return of({ success: true });
      })
    );
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      catchError(() => of(this.storeData.getProducts()))
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`).pipe(
      catchError(() => of(this.storeData.getProductById(id) as Product))
    );
  }

  addProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, formData).pipe(
      catchError(() => from(this.storeData.saveProductFromFormData(formData)).pipe(
        map(product => ({ id: product.id }))
      ))
    );
  }

  updateProduct(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, formData).pipe(
      catchError(() => from(this.storeData.saveProductFromFormData(formData, id)).pipe(
        map(product => ({ id: product.id, success: true }))
      ))
    );
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`).pipe(
      catchError(() => {
        this.storeData.deleteProduct(id);
        return of({ success: true });
      })
    );
  }

  // Orders
  createOrder(order: Order): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, order).pipe(
      catchError(() => of(this.storeData.saveOrder(order)))
    );
  }

  addProductSize(productId: number, size: ProductSize): Observable<ProductSize> {
    return this.http.post<ProductSize>(`${this.apiUrl}/products/${productId}/sizes`, size);
  }

  updateProductSize(productId: number, sizeId: number, size: ProductSize): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${productId}/sizes/${sizeId}`, size);
  }

  deleteProductSize(productId: number, sizeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${productId}/sizes/${sizeId}`);
  }

  uploadProductImages(productId: number, formData: FormData) {
    return this.http.post(`${this.apiUrl}/products/${productId}/images`, formData).pipe(
      catchError(() => from(this.storeData.updateProductGallery(productId, formData)).pipe(
        map(() => ({ success: true }))
      ))
    );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`).pipe(
      catchError(() => of(this.storeData.getOrders()))
    );
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`).pipe(
      catchError(() => of(this.storeData.getOrders().find(order => order.id === id) as Order))
    );
  }

  // Stats
  getSummaryStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.apiUrl}/stats/summary`).pipe(
      catchError(() => of(this.storeData.getStats()))
    );
  }

  getDailyStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats/daily`).pipe(
      catchError(() => of(this.storeData.getDailyStats()))
    );
  }

  // Banners
  getBanners(): Observable<Banner[]> {
    return of(this.storeData.getBanners());
  }

  addBanner(banner: Banner): Observable<Banner> {
    return of(this.storeData.saveBanner(banner));
  }

  updateBanner(id: number, banner: Banner): Observable<Banner> {
    return of(this.storeData.saveBanner({ ...banner, id }));
  }

  deleteBanner(id: number): Observable<any> {
    this.storeData.deleteBanner(id);
    return of({ success: true });
  }

  // Auth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      catchError(() => of({
        success: credentials?.email === 'brewandleaf@gmail.com' && credentials?.password === 'admin123',
        token: 'demo-admin-token',
        user: { name: 'Brew & Leaf Admin', email: credentials?.email || 'brewandleaf@gmail.com' }
      }).pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Invalid email or password');
          }

          return response;
        }),
        catchError(() => throwError(() => new Error('Invalid email or password')))
      ))
    );
  }
}
