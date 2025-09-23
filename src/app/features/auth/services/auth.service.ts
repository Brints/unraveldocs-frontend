import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import {
  User,
  SignupRequest,
  LoginRequest,
  AuthResponse,
  SocialAuthProvider,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerificationRequest,
  AuthError,
  AuthErrorCodes
} from '../models/auth.model';

