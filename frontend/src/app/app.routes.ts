import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { Homepage2Component } from './pages/homepage2/homepage2.component';
import { FullMenuComponent } from './pages/full-menu/full-menu.component';
import { LoginComponent } from './pages/login/login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ProductManagementComponent } from './pages/product-mgmt/product-mgmt.component';
import { BillingComponent } from './pages/billing/billing.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CategoryManagementComponent } from './pages/category-mgmt/category-mgmt.component';
import { SubCategoryManagementComponent } from './pages/sub-category-mgmt/sub-category-mgmt.component';
import { StatsComponent } from './pages/admin-dashboard/stats/stats.component';
import { BannerManagementComponent } from './pages/banner-mgmt/banner-mgmt.component';
import { adminAuthGuard, loginRedirectGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'homepage2', component: Homepage2Component },
  { path: 'full-menu', component: FullMenuComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
  { 
    path: 'admin', 
    component: AdminDashboardComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: StatsComponent },
      { path: 'banners', component: BannerManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'sub-categories', component: SubCategoryManagementComponent },
      { path: 'products', component: ProductManagementComponent },
      { path: 'billing', component: BillingComponent }
    ]
  }
];
