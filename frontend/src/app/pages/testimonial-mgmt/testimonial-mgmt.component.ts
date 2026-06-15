import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Testimonial {
  id?: number;
  name: string;
  role?: string;
  text: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

@Component({
  selector: 'app-testimonial-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './testimonial-mgmt.component.html',
  styleUrls: ['./testimonial-mgmt.component.scss']
})
export class TestimonialManagementComponent implements OnInit {
  testimonials: Testimonial[] = [
    { id: 1, name: 'Rahul Sharma', role: 'Regular Customer', text: 'Amazing coffee and atmosphere! Best in town.', is_active: true },
    { id: 2, name: 'Priya Patel', role: 'Coffee Lover', text: 'I visit every weekend for their amazing latte art!', is_active: true }
  ];
  showModal = false;
  isEditing = false;
  newTestimonial: Testimonial = this.createEmptyTestimonial();
  loading = false;

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTestimonials();
  }

  loadTestimonials(): void {
    this.apiService.getTestimonials().subscribe((data: any) => {
      if (data && data.length > 0) {
        this.testimonials = data;
      }
    });
  }

  saveTestimonial(): void {
    this.loading = true;
    setTimeout(() => {
      if (this.isEditing) {
        const index = this.testimonials.findIndex(t => t.id === this.newTestimonial.id);
        if (index !== -1) {
          this.testimonials[index] = { ...this.newTestimonial };
        }
      } else {
        this.newTestimonial.id = Date.now();
        this.newTestimonial.created_at = new Date().toISOString();
        this.testimonials.push(this.newTestimonial);
      }
      this.loading = false;
      this.closeModal();
    }, 500);
  }

  editTestimonial(testimonial: Testimonial): void {
    this.newTestimonial = { ...testimonial };
    this.isEditing = true;
    this.showModal = true;
  }

  deleteTestimonial(id: number): void {
    if (!confirm('Delete this testimonial?')) {
      return;
    }
    this.testimonials = this.testimonials.filter(t => t.id !== id);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.newTestimonial.image_url = await this.readFileAsDataUrl(file);
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.newTestimonial = this.createEmptyTestimonial();
  }

  private createEmptyTestimonial(): Testimonial {
    return {
      name: '',
      role: '',
      text: '',
      is_active: true,
      image_url: ''
    };
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
