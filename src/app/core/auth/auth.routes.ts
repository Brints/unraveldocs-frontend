import { Routes } from '@angular/router';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { GoogleCallbackComponent } from './components/google-callback/google-callback.component';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Sign In - ReDraft'
  },
  {
    path: 'signup',
    component: SignupComponent,
    title: 'Create Account - ReDraft'
  },
  {
    path: 'google/callback',
    component: GoogleCallbackComponent,
    title: 'Completing Signup - ReDraft'
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
    title: 'Verify Email - ReDraft'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Reset Password - ReDraft'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Set New Password - ReDraft'
  }
];
