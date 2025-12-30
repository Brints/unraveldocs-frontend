import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserStateService } from '../../services/user-state.service';
import { UserApiService } from '../../services/user-api.service';
import { UpdateProfileRequest } from '../../models/user.model';

interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userState = inject(UserStateService);
  private readonly userApi = inject(UserApiService);

  readonly profile = this.userState.profile;
  readonly fullName = this.userState.fullName;
  readonly initials = this.userState.initials;
  readonly isLoading = this.userState.isLoading;

  // Form
  profileForm!: FormGroup;

  // State
  isSaving = signal(false);
  isUploading = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);

  // Countries list
  readonly countries: CountryOption[] = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  ngOnInit(): void {
    this.initForm();
    this.loadProfileData();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      country: [''],
      profession: ['', [Validators.maxLength(100)]],
      organization: ['', [Validators.maxLength(100)]],
    });
  }

  private loadProfileData(): void {
    const profile = this.profile();
    if (profile) {
      this.profileForm.patchValue({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        country: profile.country || '',
        profession: profile.profession || '',
        organization: profile.organization || '',
      });
    }
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validate file
    if (!file.type.startsWith('image/')) {
      this.saveError.set('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.saveError.set('Image size must be less than 5MB');
      return;
    }

    this.isUploading.set(true);
    this.saveError.set(null);

    this.userState.uploadProfilePicture(file);

    // Simulate upload completion (in real app, this would be handled by state service)
    setTimeout(() => {
      this.isUploading.set(false);
    }, 2000);
  }

  removeAvatar(): void {
    const profile = this.profile();
    if (!profile?.id) return;

    this.isUploading.set(true);
    this.userApi.deleteProfilePicture(profile.id).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.userState.refreshProfile();
      },
      error: (error) => {
        this.isUploading.set(false);
        this.saveError.set('Failed to remove profile picture');
        console.error('Remove avatar error:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormTouched();
      return;
    }

    this.isSaving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);

    const formValue = this.profileForm.getRawValue();
    const updateData: UpdateProfileRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phoneNumber: formValue.phoneNumber || undefined,
      country: formValue.country || undefined,
      profession: formValue.profession || undefined,
      organization: formValue.organization || undefined,
    };

    const profile = this.profile();
    if (!profile?.id) {
      this.saveError.set('User profile not found');
      this.isSaving.set(false);
      return;
    }

    this.userApi.updateProfile(profile.id, updateData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        this.userState.refreshProfile();

        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.saveError.set(error.error?.message || 'Failed to update profile');
        console.error('Profile update error:', error);
      }
    });
  }

  private markFormTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.profileForm.get(controlName);
    if (!control?.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) {
      return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    }
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
    }
    if (control.errors['pattern']) {
      if (controlName === 'phoneNumber') return 'Enter a valid phone number';
      return 'Invalid format';
    }

    return null;
  }

  hasError(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control?.touched && control?.errors);
  }
}

