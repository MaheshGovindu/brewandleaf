import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, Order, OrderItem, ProductSize } from '../../models/brew-and-leaf.models';
import { jsPDF } from 'jspdf';

const SIZE_ORDER = ['small', 'regular', 'large'];

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  products: Product[] = [];
  cart: OrderItem[] = [];
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  searchTerm = '';
  selectedCategory = 'All';
  discount = 0;
  discountType: 'amount' | 'percent' = 'amount';
  invoiceNumber = '';
  today = new Date();

  showSizeModal = false;
  selectedProductForSize: Product | null = null;

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getProducts().subscribe(data => this.products = data);
  }

  get groupedAndFilteredProducts(): { [key: string]: Product[] } {
    const search = this.searchTerm.trim().toLowerCase();
    let filtered = this.products;

    if (search) {
      filtered = this.products.filter(product =>
        product.name.toLowerCase().includes(search) ||
        (product.category_name || '').toLowerCase().includes(search) ||
        (product.sub_category_name || '').toLowerCase().includes(search)
      );
    }

    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(product => (product.category_name || 'Other') === this.selectedCategory);
    }

    return filtered.reduce((acc, product) => {
      const category = product.category_name || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as { [key: string]: Product[] });
  }

  get categories(): string[] {
    return Object.keys(this.groupedAndFilteredProducts).sort();
  }

  get categoryTabs(): string[] {
    const names = [...new Set(this.products.map(p => p.category_name || 'Other'))].sort();
    return ['All', ...names];
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  sortedSizes(sizes: ProductSize[] = []): ProductSize[] {
    return [...sizes].sort((a, b) => {
      const aIndex = SIZE_ORDER.indexOf(a.size.toLowerCase());
      const bIndex = SIZE_ORDER.indexOf(b.size.toLowerCase());
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }

  getPriceLabel(product: Product): string {
    if (product.sizes && product.sizes.length > 0) {
      const sorted = this.sortedSizes(product.sizes);
      return sorted
        .map(sz => `${this.sizeLabel(sz.size)} ${Number(sz.price).toFixed(0)}`)
        .join(' · ');
    }
    return `₹${Number(product.price || 0).toFixed(0)}`;
  }

  sizeLabel(size: string): string {
    const key = size.toLowerCase();
    if (key === 'small') return 'S';
    if (key === 'regular') return 'R';
    if (key === 'large') return 'L';
    return size.charAt(0).toUpperCase();
  }

  isProductInCart(product: Product): boolean {
    return this.cart.some(item => item.product_id === product.id);
  }

  getCartQuantityForProduct(product: Product): number {
    return this.cart
      .filter(item => item.product_id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  openSizeSelector(product: Product): void {
    if (product.sizes && product.sizes.length > 0) {
      this.selectedProductForSize = product;
      this.showSizeModal = true;
    } else {
      this.addToCartWithSize(product, undefined);
    }
  }

  addToCartWithSize(product: Product, sizeId?: number): void {
    const selectedSize = sizeId && product.sizes
      ? product.sizes.find(s => s.id === sizeId)
      : undefined;

    const unitPrice = selectedSize ? Number(selectedSize.price) : Number(product.price) || 0;
    const sizeName = selectedSize?.size || 'default';

    const existing = this.cart.find(item =>
      item.product_id === product.id && (item.size || 'default') === sizeName
    );

    if (existing) {
      existing.quantity++;
      existing.total_price = existing.quantity * existing.unit_price;
    } else {
      this.cart.push({
        product_id: product.id!,
        name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
        size: selectedSize?.size,
        image_url: product.image_url
      });
    }

    this.closeSizeModal();
  }

  closeSizeModal(): void {
    this.showSizeModal = false;
    this.selectedProductForSize = null;
  }

  changeQuantity(index: number, delta: number): void {
    const item = this.cart[index];
    if (!item) {
      return;
    }

    item.quantity = Math.max(1, item.quantity + delta);
    item.total_price = item.quantity * item.unit_price;
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.total_price, 0);
  }

  get total(): number {
    return Math.max(0, this.subtotal - this.discountAmount);
  }

  get discountAmount(): number {
    const d = Number(this.discount) || 0;
    if (this.discountType === 'percent') {
      return +(this.subtotal * (d / 100));
    }
    return d;
  }

  generateInvoice(): void {
    this.invoiceNumber = this.createInvoiceNumber();
    const whatsappWindow = this.customerPhone ? window.open('about:blank') : null;

    const order: Order = {
      customer_name: this.customerName,
      customer_email: this.customerEmail,
      customer_phone: this.customerPhone,
      invoice_number: this.invoiceNumber,
      items: this.cart,
      total_amount: this.subtotal,
      discount_applied: this.discountAmount,
      final_amount: this.total,
      discount_type: this.discountType,
      discount_percent: this.discountType === 'percent' ? this.discount : undefined
    };

    this.apiService.createOrder(order).subscribe(async () => {
      alert('Order created! Generating PDF...');
      try {
        await this.downloadPDF(whatsappWindow);
      } finally {
        this.resetBilling();
      }
    }, () => {
      alert('Unable to generate invoice. Please try again.');
    });
  }

  createInvoiceNumber(): string {
    return `BWL-${Date.now().toString().slice(-8)}`;
  }

  cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  openWhatsApp(): void {
    if (!this.customerPhone) {
      return;
    }

    const phone = this.cleanPhoneNumber(this.customerPhone);
    if (!phone) {
      return;
    }

    const message = `Hello ${this.customerName || 'Customer'}, your invoice ${this.invoiceNumber} has been generated for a total of ${this.total.toFixed(2)}. Thank you for ordering from Brew & Leaf!`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  async downloadPDF(whatsappWindow?: Window | null): Promise<void> {
    const data = document.getElementById('invoice-content');
    if (!data) {
      return;
    }

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(data as HTMLElement, {
      useCORS: true,
      allowTaint: true,
      scale: 2
    });

    const imgWidth = 208;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    const contentDataURL = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
    const blob = pdf.output('blob');

    try {
      const form = new FormData();
      const filename = `${this.invoiceNumber || 'invoice'}_${Date.now()}.pdf`;
      form.append('file', blob, filename);

      this.apiService.uploadInvoice(form).subscribe(res => {
        const fileUrl = res && res.url ? res.url : null;
        pdf.save(filename);

        if (fileUrl && this.customerPhone) {
          const phone = this.cleanPhoneNumber(this.customerPhone);
          if (phone) {
            const message = `Hello ${this.customerName || 'Customer'}, your invoice ${this.invoiceNumber} has been generated for a total of ${this.total.toFixed(2)}. You can download it here: ${fileUrl}`;
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            if (whatsappWindow && !whatsappWindow.closed) {
              whatsappWindow.location.href = whatsappUrl;
            } else {
              window.open(whatsappUrl, '_blank');
            }
          }
        }
      }, () => {
        pdf.save(filename);
      });
    } catch {
      pdf.save(`invoice_${Date.now()}.pdf`);
    }
  }

  resetBilling(): void {
    this.cart = [];
    this.customerName = '';
    this.customerEmail = '';
    this.customerPhone = '';
    this.discount = 0;
    this.invoiceNumber = '';
  }
}
