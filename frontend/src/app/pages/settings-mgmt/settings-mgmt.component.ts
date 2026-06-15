import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Settings {
  about_title?: string;
  about_description?: string;
  contact_phone?: string;
  contact_address?: string;
  opening_hours?: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-settings-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-mgmt.component.html',
  styleUrls: ['./settings-mgmt.component.scss']
})
export class SettingsManagementComponent implements OnInit {
  settings: Settings = {};
  originalSettings: Settings = {};
  loading = false;
  editingKey: string | null = null;

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.getSettings().subscribe((data: any) => {
      if (data) {
        this.settings = data;
        this.originalSettings = { ...data };
      }
    });
  }

  formatKey(key: string): string {
    return key.replace(/_/g, ' ').toUpperCase();
  }

  getKeys(): string[] {
    return Object.keys(this.settings);
  }

  startEdit(key: string): void {
    this.editingKey = key;
  }

  cancelEdit(): void {
    this.settings = { ...this.originalSettings };
    this.editingKey = null;
  }

  saveSetting(key: string): void {
    this.loading = true;
    const value = this.settings[key] || '';
    this.apiService.updateSettings(key, value).subscribe({
      next: () => {
        this.originalSettings[key] = value;
        this.editingKey = null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error saving setting:', err);
        this.loading = false;
      }
    });
  }
}
