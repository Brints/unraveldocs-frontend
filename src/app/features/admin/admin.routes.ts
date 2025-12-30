import {Routes} from '@angular/router';
import {AdminDashboardComponent} from './components/admin-dashboard.component';

export const adminRoutes: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    title: 'Unraveldocs | Admin Dashboard'
  }
]
