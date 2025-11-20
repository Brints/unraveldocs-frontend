import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {

  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
      const isValidLength = value.length >= 8;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;

      return passwordValid ? null : {
        strongPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar,
          isValidLength
        }
      };
    };
  }

  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordField);
      const confirmPassword = formGroup.get(confirmPasswordField);

      if (!password || !confirmPassword) return null;

      if (confirmPassword.errors && !confirmPassword.errors['passwordMatch']) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMatch: true });
        return { passwordMatch: true };
      } else {
        confirmPassword.setErrors(null);
        return null;
      }
    };
  }

  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasWhitespace = /\s/.test(value);
      return hasWhitespace ? { whitespace: true } : null;
    };
  }

  static emailDomain(allowedDomains: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const emailParts = value.split('@');
      if (emailParts.length !== 2) return null;

      const domain = emailParts[1].toLowerCase();
      const isAllowed = allowedDomains.some(allowedDomain =>
        domain === allowedDomain.toLowerCase()
      );

      return isAllowed ? null : { emailDomain: { allowedDomains } };
    };
  }

  static minAge(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= minAge ? null : { minAge: { requiredAge: minAge, actualAge: age } };
    };
  }

  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      // Basic international phone number validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(value.replace(/[\s\-\(\)]/g, '')) ? null : { phoneNumber: true };
    };
  }

  static pastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return selectedDate < today ? null : { pastDate: true };
    };
  }
}
