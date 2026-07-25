import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  isCompactView = false;
  sidebarOpen = true;
  isSidebarHovered = false;
  private previousCompactView: boolean | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.updateSidebarState();
  }

  get userName(): string {
    return this.authService.getUser()?.name || 'Admin';
  }

  get isSidebarExpanded(): boolean {
    if (this.isCompactView) {
      return this.sidebarOpen;
    }

    return this.sidebarOpen || this.isSidebarHovered;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateSidebarState();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  openSidebarOnHover(): void {
    if (!this.isCompactView && !this.sidebarOpen) {
      this.isSidebarHovered = true;
    }
  }

  closeSidebarOnHoverOut(): void {
    if (!this.isCompactView) {
      this.isSidebarHovered = false;
    }
  }

  handleSidebarNavigation(): void {
    if (this.isCompactView) {
      this.closeSidebar();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private updateSidebarState(): void {
    if (typeof window === 'undefined') {
      this.isCompactView = false;
      this.sidebarOpen = true;
      this.previousCompactView = false;
      return;
    }

    const compactView = window.innerWidth <= 1100;
    this.isCompactView = compactView;
    if (compactView) {
      this.isSidebarHovered = false;
    }

    if (this.previousCompactView === null || this.previousCompactView !== compactView) {
      this.sidebarOpen = compactView ? false : true;
    }

    this.previousCompactView = compactView;
  }
}
