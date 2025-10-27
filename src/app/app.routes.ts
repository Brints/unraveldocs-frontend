import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { SignupComponent } from './features/auth/components/signup/signup.component';
import { LandingComponent } from './features/landing-page/components/landing.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', redirectTo: '/home' }, // Temporary redirect until dashboard is created
  { path: '**', redirectTo: '/home' }
];
