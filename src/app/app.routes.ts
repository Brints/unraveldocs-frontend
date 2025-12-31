import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing-page/components/landing.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LandingComponent },
  {
    path: 'auth',
    loadChildren: () => import('./core/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./features/privacy/privacy.routes').then(m => m.privacyRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./features/user/user.routes').then(m => m.userRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./features/documents/documents.routes').then(m => m.documentRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./features/ocr/ocr.routes').then(m => m.ocrRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./features/subscription/subscription.routes').then(m => m.subscriptionRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./features/payments/payments.routes').then(m => m.paymentRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./features/teams/teams.routes').then(m => m.teamRoutes)
  },
  { path: '**', redirectTo: '/home' }
];
