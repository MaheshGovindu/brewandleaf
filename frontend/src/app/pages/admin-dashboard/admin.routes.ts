import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { StatsComponent } from './stats/stats.component';
import { BannerManagementComponent } from '../banner-mgmt/banner-mgmt.component';
import { TestimonialManagementComponent } from '../testimonial-mgmt/testimonial-mgmt.component';
import { CategoryManagementComponent } from '../category-mgmt/category-mgmt.component';
import { SubCategoryManagementComponent } from '../sub-category-mgmt/sub-category-mgmt.component';
import { ProductManagementComponent } from '../product-mgmt/product-mgmt.component';
import { BillingComponent } from '../billing/billing.component';
import { TransactionHistoryComponent } from '../transaction-history/transaction-history.component';
import { CreditDebitComponent } from '../credit-debit/credit-debit.component';
import { SettingsManagementComponent } from '../settings-mgmt/settings-mgmt.component';
import { adminAuthGuard } from '../../guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: StatsComponent },
      { path: 'banners', component: BannerManagementComponent },
      { path: 'testimonials', component: TestimonialManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'sub-categories', component: SubCategoryManagementComponent },
      { path: 'products', component: ProductManagementComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'transactions', component: TransactionHistoryComponent },
      { path: 'credit-debit', component: CreditDebitComponent },
      { path: 'settings', component: SettingsManagementComponent }
    ]
  }
];
