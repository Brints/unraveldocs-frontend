import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {FormInputComponent} from '../../../../shared/ui/form-input.component';
import {PasswordGeneratorComponent} from '../../../../shared/ui/password-generator.component';
import {ButtonComponent} from '../../../../shared/ui/button.component';
import {PasswordStrengthComponent} from '../../../../shared/ui/password-strength.component';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormInputComponent,
    ButtonComponent,
    PasswordStrengthComponent,
    PasswordGeneratorComponent
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  currentPassword = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  showPasswordGen = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
      marketing: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.signupForm.get(fieldName);
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern'] && fieldName === 'password') return 'Password must contain uppercase, lowercase, number, and special character';
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
      if (field.errors['requiredTrue']) return 'You must agree to the terms and conditions';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full name',
      email: 'Email address',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  onPasswordChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.currentPassword.set(target.value);
  }

  toggleTerms(): void {
    const current = this.signupForm.get('terms')?.value;
    this.signupForm.patchValue({ terms: !current });
  }

  toggleMarketing(): void {
    const current = this.signupForm.get('marketing')?.value;
    this.signupForm.patchValue({ marketing: !current });
  }

  showPasswordGenerator(): void {
    this.showPasswordGen.set(true);
  }

  hidePasswordGenerator(): void {
    this.showPasswordGen.set(false);
  }

  onPasswordGenerated(password: string): void {
    this.signupForm.patchValue({
      password: password,
      confirmPassword: password
    });
    this.currentPassword.set(password);
    this.hidePasswordGenerator();
  }

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.signupForm.value;
      await this.authService.signup({
        name: formValue.fullName,
        email: formValue.email,
        password: formValue.password
      });

      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An error occurred during signup. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async signupWithGoogle(): Promise<void> {
    // Implement Google OAuth signup
    console.log('Signup with Google');
  }

  async signupWithGitHub(): Promise<void> {
    // Implement GitHub OAuth signup
    console.log('Signup with GitHub');
  }
}
