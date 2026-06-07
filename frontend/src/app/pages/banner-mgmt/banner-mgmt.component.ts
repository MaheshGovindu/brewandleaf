import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Banner } from '../../models/brew-and-leaf.models';

@Component({
  selector: 'app-banner-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banner-mgmt.component.html',
  styleUrl: './banner-mgmt.component.scss'
})
export class BannerManagementComponent implements OnInit {
  banners: Banner[] = [];
  showModal = false;
  isEditing = false;
  newBanner: Banner = this.createEmptyBanner();

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners(): void {
    this.apiService.getBanners().subscribe(data => {
      this.banners = data;
    });
  }

  saveBanner(): void {
    const request = this.isEditing && this.newBanner.id
      ? this.apiService.updateBanner(this.newBanner.id, this.newBanner)
      : this.apiService.addBanner(this.newBanner);

    request.subscribe(() => {
      this.loadBanners();
      this.closeModal();
    });
  }

  editBanner(banner: Banner): void {
    this.newBanner = { ...banner };
    this.isEditing = true;
    this.showModal = true;
  }

  deleteBanner(id: number): void {
    if (!confirm('Delete this banner?')) {
      return;
    }

    this.apiService.deleteBanner(id).subscribe(() => this.loadBanners());
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.newBanner.image_url = await this.readFileAsDataUrl(file);
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.newBanner = this.createEmptyBanner();
  }

  private createEmptyBanner(): Banner {
    return {
      title: '',
      description: '',
      cta_label: 'Explore Menu',
      cta_link: '#menu',
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
