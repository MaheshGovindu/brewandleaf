import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { Homepage2Component } from './pages/homepage2/homepage2.component';
import { FullMenuComponent } from './pages/full-menu/full-menu.component';
import { LoginComponent } from './pages/login/login.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { loginRedirectGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'homepage2', component: Homepage2Component },
  { path: 'full-menu', component: FullMenuComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
  { 
    path: 'admin', 
    loadChildren: () => import('./pages/admin-dashboard/admin.routes').then(m => m.adminRoutes)
  }
];
