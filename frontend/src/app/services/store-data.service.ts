import { Injectable } from '@angular/core';
import { Banner, Category, DailyStats, MonthlyStats, Order, Product, Stats, SubCategory } from '../models/brew-and-leaf.models';
import { DEMO_BANNERS, DEMO_CATEGORIES, DEMO_ORDERS, DEMO_PRODUCTS, DEMO_SUB_CATEGORIES } from '../data/demo-store.data';

@Injectable({
  providedIn: 'root'
})
export class StoreDataService {
  private readonly hasStorage = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  private readonly memoryStore = new Map<string, string>();
  private readonly keys = {
    categories: 'brewandleaf.categories',
    subCategories: 'brewandleaf.subCategories',
    products: 'brewandleaf.products',
    banners: 'brewandleaf.banners',
    orders: 'brewandleaf.orders'
  };

  constructor() {
    this.ensureSeedData();
  }

  getCategories(): Category[] {
    return this.read(this.keys.categories, DEMO_CATEGORIES);
  }

  saveCategory(category: Category): Category {
    const categories = this.getCategories();
    if (category.id) {
      const index = categories.findIndex(item => item.id === category.id);
      if (index >= 0) {
        categories[index] = { ...categories[index], ...category };
      }
    } else {
      category.id = this.nextId(categories);
      categories.unshift(category);
    }
    this.write(this.keys.categories, categories);
    return category;
  }

  deleteCategory(id: number): void {
    this.write(this.keys.categories, this.getCategories().filter(item => item.id !== id));
  }

  getSubCategories(): SubCategory[] {
    return this.read(this.keys.subCategories, DEMO_SUB_CATEGORIES).map(sub => ({
      ...sub,
      category_name: sub.category_name || this.getCategories().find(category => category.id === sub.category_id)?.name || ''
    }));
  }

  saveSubCategory(subCategory: SubCategory): SubCategory {
    const items = this.getSubCategories();
    const categoryName = this.getCategories().find(item => item.id === subCategory.category_id)?.name || '';
    const payload = { ...subCategory, category_name: categoryName };

    if (payload.id) {
      const index = items.findIndex(item => item.id === payload.id);
      if (index >= 0) {
        items[index] = { ...items[index], ...payload };
      }
    } else {
      payload.id = this.nextId(items);
      items.unshift(payload);
    }

    this.write(this.keys.subCategories, items);
    return payload;
  }

  deleteSubCategory(id: number): void {
    this.write(this.keys.subCategories, this.getSubCategories().filter(item => item.id !== id));
  }

  getProducts(): Product[] {
    return this.read(this.keys.products, DEMO_PRODUCTS).map(product => {
      const category = this.getCategories().find(item => item.id === product.category_id);
      const subCategory = this.getSubCategories().find(item => item.id === product.sub_category_id);
      return {
        ...product,
        category_name: category?.name || product.category_name,
        sub_category_name: subCategory?.name || product.sub_category_name
      };
    });
  }

  getProductById(id: number): Product | undefined {
    return this.getProducts().find(item => item.id === id);
  }

  saveProduct(product: Product): Product {
    const items = this.getProducts();
    const category = this.getCategories().find(item => item.id === product.category_id);
    const subCategory = this.getSubCategories().find(item => item.id === product.sub_category_id);
    const payload: Product = {
      ...product,
      category_name: category?.name || product.category_name,
      sub_category_name: subCategory?.name || product.sub_category_name
    };

    if (payload.id) {
      const index = items.findIndex(item => item.id === payload.id);
      if (index >= 0) {
        items[index] = { ...items[index], ...payload };
      }
    } else {
      payload.id = this.nextId(items);
      items.unshift(payload);
    }

    this.write(this.keys.products, items);
    return payload;
  }

  deleteProduct(id: number): void {
    this.write(this.keys.products, this.getProducts().filter(item => item.id !== id));
  }

  async saveProductFromFormData(formData: FormData, existingId?: number): Promise<Product> {
    const current = existingId ? this.getProductById(existingId) : undefined;
    const numericKeys = new Set(['category_id', 'sub_category_id', 'price', 'costing', 'discount', 'inventory_count']);
    const payload: Product = {
      id: existingId,
      category_id: current?.category_id || 0,
      name: current?.name || '',
      price: current?.price || 0,
      costing: current?.costing || 0,
      discount: current?.discount || 0,
      inventory_count: current?.inventory_count || 0,
      description: current?.description || '',
      image_url: current?.image_url || '',
      images: current?.images || [],
      aspect_ratio: current?.aspect_ratio || '1:1',
      sub_category_id: current?.sub_category_id
    };

    formData.forEach((value, key) => {
      if (key === 'image' || key === 'images') {
        return;
      }

      if (typeof value === 'string') {
        if (numericKeys.has(key)) {
          (payload as any)[key] = value === '' || value === 'null' ? undefined : Number(value);
        } else if (key === 'is_featured') {
          payload.is_featured = value === 'true';
        } else {
          (payload as any)[key] = value;
        }
      }
    });

    const imageFile = formData.get('image');
    if (imageFile instanceof File && imageFile.size > 0) {
      payload.image_url = await this.fileToDataUrl(imageFile);
    }

    const galleryFiles = formData.getAll('images').filter(item => item instanceof File && item.size > 0) as File[];
    if (galleryFiles.length) {
      payload.images = await Promise.all(galleryFiles.map(file => this.fileToDataUrl(file)));
      if (!payload.image_url) {
        payload.image_url = payload.images[0];
      }
    }

    return this.saveProduct(payload);
  }

  async updateProductGallery(productId: number, formData: FormData): Promise<Product | undefined> {
    const current = this.getProductById(productId);
    if (!current) {
      return undefined;
    }

    const galleryFiles = formData.getAll('images').filter(item => item instanceof File && item.size > 0) as File[];
    if (!galleryFiles.length) {
      return current;
    }

    const images = await Promise.all(galleryFiles.map(file => this.fileToDataUrl(file)));
    return this.saveProduct({
      ...current,
      images,
      image_url: current.image_url || images[0]
    });
  }

  getBanners(): Banner[] {
    return this.read(this.keys.banners, DEMO_BANNERS);
  }

  saveBanner(banner: Banner): Banner {
    const banners = this.getBanners();
    if (banner.id) {
      const index = banners.findIndex(item => item.id === banner.id);
      if (index >= 0) {
        banners[index] = { ...banners[index], ...banner };
      }
    } else {
      banner.id = this.nextId(banners);
      banners.unshift({ ...banner, is_active: banner.is_active ?? true });
    }
    this.write(this.keys.banners, banners);
    return banner;
  }

  deleteBanner(id: number): void {
    this.write(this.keys.banners, this.getBanners().filter(item => item.id !== id));
  }

  getOrders(): Order[] {
    return this.read(this.keys.orders, DEMO_ORDERS);
  }

  saveOrder(order: Order): Order {
    const orders = this.getOrders();
    const payload: Order = {
      ...order,
      id: this.nextId(orders),
      created_at: order.created_at || new Date().toISOString()
    };
    orders.unshift(payload);
    this.write(this.keys.orders, orders);
    return payload;
  }

  getStats(): Stats {
    const orders = this.getOrders();
    const products = this.getProducts();
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.final_amount || 0), 0);
    const totalCost = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + Number(item.total_cost || 0), 0), 0);
    const totalMargin = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + Number(item.total_margin || 0), 0), 0);
    return {
      total_revenue: totalRevenue,
      today_revenue: 0,
      total_cost: totalCost,
      total_margin: totalMargin,
      total_profit: totalRevenue - totalCost,
      today_cost: 0,
      today_margin: 0,
      today_profit: 0,
      current_month_revenue: 0,
      current_month_cost: 0,
      current_month_margin: 0,
      current_month_profit: 0,
      total_orders: orders.length,
      today_orders: 0,
      total_products: products.length,
      total_inventory: products.reduce((sum, product) => sum + Number(product.inventory_count || 0), 0),
      total_credit: 0,
      total_debit: 0
    };
  }

  getDailyStats(): DailyStats[] {
    const byDate = new Map<string, DailyStats>();
    this.getOrders().forEach(order => {
      const date = new Date(order.created_at || new Date()).toLocaleDateString('en-CA');
      const entry = byDate.get(date) || {
        date,
        total_sales: 0,
        total_cost: 0,
        total_margin: 0,
        total_profit: 0,
        total_credit: 0,
        total_debit: 0
      };
      entry.total_sales = Number(entry.total_sales || 0) + Number(order.final_amount || 0);
      entry.total_cost = Number(entry.total_cost || 0) + order.items.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);
      entry.total_margin = Number(entry.total_margin || 0) + order.items.reduce((sum, item) => sum + Number(item.total_margin || 0), 0);
      entry.total_profit = Number(entry.total_profit || 0) + (Number(order.final_amount || 0) - order.items.reduce((sum, item) => sum + Number(item.total_cost || 0), 0));
      byDate.set(date, entry);
    });

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, stat]) => stat);
  }

  getMonthlyStats(): MonthlyStats[] {
    const byMonth = new Map<string, MonthlyStats>();
    this.getDailyStats().forEach(stat => {
      const month = stat.date.slice(0, 7);
      const entry = byMonth.get(month) || {
        month,
        total_sales: 0,
        total_cost: 0,
        total_margin: 0,
        total_profit: 0,
        total_credit: 0,
        total_debit: 0
      };
      entry.total_sales = Number(entry.total_sales || 0) + Number(stat.total_sales || 0);
      entry.total_cost = Number(entry.total_cost || 0) + Number(stat.total_cost || 0);
      entry.total_margin = Number(entry.total_margin || 0) + Number(stat.total_margin || 0);
      entry.total_profit = Number(entry.total_profit || 0) + Number(stat.total_profit || 0);
      byMonth.set(month, entry);
    });

    return Array.from(byMonth.values()).sort((a, b) => b.month.localeCompare(a.month));
  }

  private ensureSeedData(): void {
    this.seed(this.keys.categories, DEMO_CATEGORIES);
    this.seed(this.keys.subCategories, DEMO_SUB_CATEGORIES);
    this.seed(this.keys.products, DEMO_PRODUCTS);
    this.seed(this.keys.banners, DEMO_BANNERS);
    this.seed(this.keys.orders, DEMO_ORDERS);
  }

  private seed<T>(key: string, data: T): void {
    if (!this.getItem(key)) {
      this.write(key, data);
    }
  }

  private read<T>(key: string, fallback: T): T {
    const raw = this.getItem(key);
    if (!raw) {
      return structuredClone(fallback);
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return structuredClone(fallback);
    }
  }

  private write<T>(key: string, data: T): void {
    const value = JSON.stringify(data);
    if (this.hasStorage) {
      localStorage.setItem(key, value);
      return;
    }
    this.memoryStore.set(key, value);
  }

  private getItem(key: string): string | null {
    if (this.hasStorage) {
      return localStorage.getItem(key);
    }
    return this.memoryStore.get(key) ?? null;
  }

  private nextId(items: Array<{ id?: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
