import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, Order, OrderItem } from '../../models/brew-and-leaf.models';
import { jsPDF } from 'jspdf';

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
  discount = 0;
  invoiceNumber = '';
  today = new Date();

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getProducts().subscribe(data => this.products = data);
  }

  addToCart(product: Product): void {
    const unitPrice = Number(product.price) || 0;
    const existing = this.cart.find(item => item.product_id === product.id);
    if (existing) {
      existing.quantity++;
      existing.total_price = existing.quantity * existing.unit_price;
    } else {
      this.cart.push({
        product_id: product.id!,
        name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice
      });
    }
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.total_price, 0);
  }

  get total(): number {
    return this.subtotal - this.discount;
  }

  generateInvoice(): void {
    this.invoiceNumber = this.createInvoiceNumber();

    const order: Order = {
      customer_name: this.customerName,
      customer_email: this.customerEmail,
      customer_phone: this.customerPhone,
      invoice_number: this.invoiceNumber,
      items: this.cart,
      total_amount: this.subtotal,
      discount_applied: this.discount,
      final_amount: this.total
    };

    this.apiService.createOrder(order).subscribe(res => {
      alert('Order created! Generating PDF...');
      this.downloadPDF();
      this.openWhatsApp();
      this.resetBilling();
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

  async downloadPDF(): Promise<void> {
    const data = document.getElementById('invoice-content');
    if (!data) {
      return;
    }

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(data as HTMLElement);

    const imgWidth = 208;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    const contentDataURL = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
    // generate blob and upload to backend so it can be shared via WhatsApp
    const blob = pdf.output('blob');

    try {
      const form = new FormData();
      const filename = `${this.invoiceNumber || 'invoice'}_${Date.now()}.pdf`;
      form.append('file', blob, filename);

      this.apiService.uploadInvoice(form).subscribe(res => {
        const fileUrl = res && res.url ? res.url : null;
        // trigger a local download as well
        pdf.save(filename);

        if (fileUrl && this.customerPhone) {
          const phone = this.cleanPhoneNumber(this.customerPhone);
          if (phone) {
            const message = `Hello ${this.customerName || 'Customer'}, your invoice ${this.invoiceNumber} has been generated for a total of ${this.total.toFixed(2)}. You can download it here: ${fileUrl}`;
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }
        }
      }, err => {
        // fallback: still save locally
        pdf.save(filename);
      });
    } catch (err) {
      // ensure local save if upload fails
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
