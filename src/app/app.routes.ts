import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { SignupComponent } from './components/auth/signup.component';
import { LandingComponent } from './components/landing.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', redirectTo: '/home' }, // Temporary redirect until dashboard is created
  { path: '**', redirectTo: '/home' }
];

