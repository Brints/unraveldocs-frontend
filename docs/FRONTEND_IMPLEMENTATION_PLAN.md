# 🎨 UnravelDocs Frontend Implementation Plan

A comprehensive Angular 21 frontend implementation plan for the UnravelDocs document processing platform, featuring PWA support, i18n from day one, and enterprise-grade architecture.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Principles](#architecture-principles)
4. [Project Structure](#project-structure)
5. [Feature Modules](#feature-modules)
6. [Routing Architecture](#routing-architecture)
7. [State Management](#state-management)
8. [PWA Configuration](#pwa-configuration)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Component Specifications](#component-specifications)
11. [Services & API Integration](#services--api-integration)
12. [Real-Time Features](#real-time-features)
13. [Design System](#design-system)
14. [Testing Strategy](#testing-strategy)
15. [CI/CD Pipeline](#cicd-pipeline)
16. [Implementation Phases](#implementation-phases)

---

## Overview

UnravelDocs is an enterprise-grade document processing platform enabling:
- Document upload and management with OCR processing
- Text extraction using Tesseract & Google Cloud Vision
- Team collaboration with subscription management
- Multi-gateway payments (Stripe/Paystack)
- Full-text search via Elasticsearch

### Target Users
| User Type | Description |
|-----------|-------------|
| **Individual** | Personal document processing with tiered subscriptions |
| **Team** | Collaborative processing with Premium/Enterprise plans |
| **Administrator** | Platform management and user oversight |

---

## Technology Stack

### Core Framework

| Category | Technology | Rationale |
|----------|------------|-----------|
| **Framework** | Angular 21 | Standalone components, Signals, SSR support |
| **Language** | TypeScript 5.5+ | Strict mode, template type checking |
| **Styling** | Tailwind CSS 4.0 | Utility-first, JIT compilation |
| **UI Components** | Angular Material 21 | Consistent design, accessibility built-in |
| **State** | Angular Signals + RxJS | Reactive state with fine-grained updates |
| **Forms** | Reactive Forms + Zod | Type-safe validation |
| **Charts** | ng2-charts (Chart.js) | Already installed, simple setup |
| **Advanced Charts** | @swimlane/ngx-charts | D3-based, Angular-native (optional) |
| **HTTP** | HttpClient + Interceptors | Built-in, type-safe API calls |
| **Icons** | Angular Material Icons + Lucide | Comprehensive icon sets |
| **Animations** | @angular/animations | Native Angular animations |
| **i18n** | @angular/localize | Official Angular i18n solution |
| **Testing** | Jest + Testing Library | Fast unit tests |
| **E2E** | Playwright | Cross-browser E2E testing |
| **PWA** | @angular/pwa | Service workers, offline support |

### Chart Library Recommendation

> **Current Setup**: `ng2-charts` (Chart.js wrapper) is already installed.
> 
> **Recommendation**: Keep `ng2-charts` for standard charts. Add `@swimlane/ngx-charts` for advanced visualizations requiring:
> - Real-time streaming data
> - Complex animations
> - Advanced interactivity
> - 15+ specialized chart types

```bash
# Optional: Add ngx-charts for advanced visualizations
npm install @swimlane/ngx-charts
```

### ngx-charts Dashboard Implementation Patterns

#### Why ngx-charts for Analytics Dashboards

| Feature | ng2-charts | ngx-charts |
|---------|------------|------------|
| **Angular Native** | Wrapper | Built for Angular |
| **D3 Integration** | No | Yes (D3-based) |
| **Animations** | Basic | Rich, smooth |
| **Accessibility** | Limited | Built-in ARIA |
| **Real-time Updates** | Manual | Automatic |
| **Chart Types** | 8 | 15+ |

#### Admin Dashboard Charts

```typescript
// features/admin/components/revenue-chart/revenue-chart.component.ts
@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <ngx-charts-line-chart
      [results]="revenueData()"
      [xAxis]="true"
      [yAxis]="true"
      [legend]="true"
      [showXAxisLabel]="true"
      [showYAxisLabel]="true"
      xAxisLabel="Month"
      yAxisLabel="Revenue (USD)"
      [autoScale]="true"
      [animations]="true"
      [scheme]="colorScheme">
    </ngx-charts-line-chart>
  `
})
export class RevenueChartComponent {
  private readonly adminService = inject(AdminStateService);
  
  readonly revenueData = computed(() => [
    {
      name: 'Revenue',
      series: this.adminService.monthlyRevenue()
    }
  ]);
  
  colorScheme = { domain: ['#0073ff', '#10b981', '#f59e0b'] };
}

// User Growth Chart
@Component({
  selector: 'app-user-growth-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <ngx-charts-area-chart-stacked
      [results]="userData()"
      [xAxis]="true"
      [yAxis]="true"
      [legend]="true"
      [gradient]="true"
      [animations]="true">
    </ngx-charts-area-chart-stacked>
  `
})
export class UserGrowthChartComponent {
  readonly userData = signal([
    { name: 'Free Users', series: [] },
    { name: 'Paid Users', series: [] },
    { name: 'Team Members', series: [] }
  ]);
}
```

#### User Dashboard Charts

```typescript
// features/user/components/usage-chart/usage-chart.component.ts
@Component({
  selector: 'app-usage-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <ngx-charts-gauge
      [value]="usagePercentage()"
      [min]="0"
      [max]="100"
      [units]="'OCR Pages Used'"
      [showAxis]="true"
      [bigSegments]="5"
      [angleSpan]="240"
      [startAngle]="-120">
    </ngx-charts-gauge>
  `
})
export class UsageChartComponent {
  private readonly subscription = inject(SubscriptionStateService);
  
  readonly usagePercentage = computed(() => {
    const { used, limit } = this.subscription.ocrUsage();
    return Math.round((used / limit) * 100);
  });
}

// Document Processing Analytics
@Component({
  selector: 'app-processing-stats',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <ngx-charts-pie-chart
      [results]="processingData()"
      [legend]="true"
      [labels]="true"
      [doughnut]="true"
      [arcWidth]="0.4"
      [animations]="true">
    </ngx-charts-pie-chart>
  `
})
export class ProcessingStatsComponent {
  readonly processingData = signal([
    { name: 'Completed', value: 150 },
    { name: 'Processing', value: 12 },
    { name: 'Failed', value: 3 }
  ]);
}
```

---

## Architecture Principles

### 1. Standalone Components First
```typescript
@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `...`
})
export class DocumentCardComponent {}
```

### 2. Signals-First State Management
```typescript
// Prefer Signals over BehaviorSubjects
readonly documents = signal<Document[]>([]);
readonly isLoading = signal(false);
readonly documentCount = computed(() => this.documents().length);
```

### 3. Smart/Dumb Component Pattern
- **Smart (Container)**: Handle state and business logic
- **Dumb (Presentational)**: Pure UI, receive inputs, emit outputs

### 4. Lazy Loading Everything
```typescript
// All feature modules loaded lazily
{ path: 'documents', loadChildren: () => import('./features/documents/routes') }
```

### 5. Dependency Injection Everywhere
```typescript
// Use inject() function in standalone components
private readonly api = inject(ApiService);
private readonly router = inject(Router);
```

---

## Project Structure

```
src/
├── app/
│   ├── core/                           # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── admin.guard.ts
│   │   │   ├── team-role.guard.ts
│   │   │   └── subscription.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   ├── loading.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── api.service.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── websocket.service.ts
│   │   │   └── notification.service.ts
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── document.model.ts
│   │       ├── team.model.ts
│   │       └── payment.model.ts
│   │
│   ├── features/                       # Feature modules (lazy loaded)
│   │   ├── auth/                       # Authentication module
│   │   ├── user/                       # User dashboard & settings
│   │   ├── documents/                  # Document management
│   │   ├── teams/                      # Team management
│   │   ├── payments/                   # Payment & billing
│   │   ├── subscriptions/              # Subscription management
│   │   ├── admin/                      # Admin dashboard
│   │   └── marketing/                  # Public pages
│   │
│   ├── shared/                         # Shared module
│   │   ├── components/
│   │   │   ├── ui/                     # Base UI components
│   │   │   ├── layout/                 # Layout components
│   │   │   └── forms/                  # Form components
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── utils/
│   │
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
│
├── assets/
│   ├── i18n/                           # Translation files
│   │   ├── en.json
│   │   ├── es.json
│   │   ├── fr.json
│   │   └── ar.json                     # RTL support
│   ├── icons/
│   └── images/
│
├── environments/
│   ├── environment.ts
│   ├── environment.development.ts
│   └── environment.production.ts
│
├── styles/
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _animations.scss
│   └── themes/
│       ├── light.scss
│       └── dark.scss
│
├── manifest.webmanifest                # PWA manifest
├── ngsw-config.json                    # Service worker config
└── index.html
```

---

## Feature Modules

### Module 1: Auth (`features/auth/`)

#### Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/auth/login` | LoginComponent | User login |
| `/auth/signup` | SignupComponent | New user registration |
| `/auth/verify-email` | VerifyEmailComponent | OTP verification |
| `/auth/forgot-password` | ForgotPasswordComponent | Request password reset |
| `/auth/reset-password` | ResetPasswordComponent | Set new password |

#### Components
```
auth/
├── pages/
│   ├── login/
│   ├── signup/
│   ├── verify-email/
│   ├── forgot-password/
│   └── reset-password/
├── components/
│   ├── auth-layout/
│   ├── social-login-buttons/
│   ├── password-strength/
│   └── otp-input/
└── services/
    └── auth-state.service.ts
```

---

### Module 2: User Dashboard (`features/user/`)

#### Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/dashboard` | DashboardComponent | authGuard |
| `/settings/profile` | ProfileSettingsComponent | authGuard |
| `/settings/security` | SecuritySettingsComponent | authGuard |
| `/settings/notifications` | NotificationSettingsComponent | authGuard |
| `/settings/billing` | BillingSettingsComponent | authGuard |

#### Components
```
user/
├── pages/
│   ├── dashboard/
│   └── settings/
│       ├── profile/
│       ├── security/
│       ├── notifications/
│       └── billing/
├── components/
│   ├── stats-card/
│   ├── activity-feed/
│   ├── usage-chart/
│   ├── quick-actions/
│   └── subscription-widget/
└── services/
    └── user-state.service.ts
```

---

### Module 3: Documents (`features/documents/`)

#### Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/documents` | DocumentsListComponent | authGuard |
| `/documents/upload` | UploadComponent | authGuard, subscriptionGuard |
| `/documents/collection/:id` | CollectionDetailComponent | authGuard |
| `/documents/collection/:collectionId/document/:documentId` | DocumentViewerComponent | authGuard |
| `/documents/search` | DocumentSearchComponent | authGuard |

#### Components
```
documents/
├── pages/
│   ├── documents-list/
│   ├── upload/
│   ├── collection-detail/
│   ├── document-viewer/
│   └── document-search/
├── components/
│   ├── collection-card/
│   ├── document-card/
│   ├── upload-dropzone/
│   ├── upload-progress/
│   ├── ocr-result-panel/
│   ├── document-preview/
│   ├── pdf-viewer/
│   ├── image-viewer/
│   ├── text-editor/
│   └── export-dialog/
└── services/
    ├── document-state.service.ts
    └── ocr.service.ts
```

---

### Module 4: Teams (`features/teams/`)

#### Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/teams` | TeamsListComponent | authGuard |
| `/teams/create` | CreateTeamComponent | authGuard |
| `/teams/:teamId` | TeamDashboardComponent | authGuard, teamMemberGuard |
| `/teams/:teamId/members` | TeamMembersComponent | authGuard, teamMemberGuard |
| `/teams/:teamId/invitations` | TeamInvitationsComponent | authGuard, teamAdminGuard |
| `/teams/:teamId/settings` | TeamSettingsComponent | authGuard, teamOwnerGuard |

#### Components
```
teams/
├── pages/
│   ├── teams-list/
│   ├── create-team/
│   │   ├── step-details/
│   │   ├── step-subscription/
│   │   ├── step-payment/
│   │   └── step-verification/
│   ├── team-dashboard/
│   ├── team-members/
│   ├── team-invitations/
│   └── team-settings/
├── components/
│   ├── team-card/
│   ├── member-list/
│   ├── member-card/
│   ├── invitation-card/
│   ├── role-badge/
│   ├── subscription-status/
│   ├── add-member-dialog/
│   ├── invite-member-dialog/
│   └── confirm-remove-dialog/
└── services/
    └── team-state.service.ts
```

---

### Module 5: Payments (`features/payments/`)

#### Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/payments/history` | PaymentHistoryComponent | authGuard |
| `/payments/receipts` | ReceiptsListComponent | authGuard |
| `/payments/receipts/:receiptNumber` | ReceiptDetailComponent | authGuard |
| `/payments/methods` | PaymentMethodsComponent | authGuard |

#### Components
```
payments/
├── pages/
│   ├── payment-history/
│   ├── receipts-list/
│   ├── receipt-detail/
│   └── payment-methods/
├── components/
│   ├── payment-table/
│   ├── receipt-card/
│   ├── payment-method-card/
│   ├── add-card-dialog/
│   ├── stripe-elements/
│   └── paystack-inline/
└── services/
    ├── stripe.service.ts
    └── paystack.service.ts
```

---

### Module 6: Subscriptions (`features/subscriptions/`)

#### Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/subscriptions` | SubscriptionOverviewComponent | authGuard |
| `/subscriptions/plans` | PlansComparisonComponent | authGuard |
| `/subscriptions/upgrade` | UpgradePlanComponent | authGuard |

#### Components
```
subscriptions/
├── pages/
│   ├── subscription-overview/
│   ├── plans-comparison/
│   └── upgrade-plan/
├── components/
│   ├── current-plan-card/
│   ├── plan-card/
│   ├── feature-list/
│   ├── usage-meter/
│   ├── billing-cycle-toggle/
│   └── currency-selector/
└── services/
    └── subscription-state.service.ts
```

---

### Module 7: Admin (`features/admin/`)

#### Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/admin` | AdminDashboardComponent | adminGuard |
| `/admin/users` | UserManagementComponent | adminGuard |
| `/admin/users/:userId` | UserDetailComponent | adminGuard |
| `/admin/documents` | DocumentManagementComponent | adminGuard |
| `/admin/payments` | PaymentManagementComponent | adminGuard |
| `/admin/subscriptions` | SubscriptionManagementComponent | adminGuard |
| `/admin/teams` | TeamManagementComponent | adminGuard |
| `/admin/search` | ElasticsearchAdminComponent | adminGuard |
| `/admin/settings` | AdminSettingsComponent | superAdminGuard |

#### Components
```
admin/
├── pages/
│   ├── admin-dashboard/
│   ├── user-management/
│   ├── user-detail/
│   ├── document-management/
│   ├── payment-management/
│   ├── subscription-management/
│   ├── team-management/
│   ├── elasticsearch-admin/
│   └── admin-settings/
├── components/
│   ├── admin-stats-cards/
│   ├── user-table/
│   ├── document-table/
│   ├── payment-table/
│   ├── team-table/
│   ├── revenue-chart/
│   ├── user-growth-chart/
│   ├── activity-log/
│   ├── sync-controls/
│   ├── role-change-dialog/
│   └── otp-manager/
└── services/
    └── admin-state.service.ts
```

---

### Module 8: Marketing (`features/marketing/`)

#### Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/` | LandingPageComponent | - |
| `/pricing` | PricingPageComponent | - |
| `/features` | FeaturesPageComponent | - |
| `/about` | AboutPageComponent | - |
| `/contact` | ContactPageComponent | - |
| `/terms` | TermsPageComponent | - |
| `/privacy` | PrivacyPageComponent | - |

#### Components
```
marketing/
├── pages/
│   ├── landing/
│   ├── pricing/
│   ├── features/
│   ├── about/
│   ├── contact/
│   ├── terms/
│   └── privacy/
├── components/
│   ├── hero-section/
│   ├── features-grid/
│   ├── pricing-table/
│   ├── testimonials/
│   ├── faq-accordion/
│   ├── cta-section/
│   ├── marketing-navbar/
│   └── marketing-footer/
└── services/
    └── contact.service.ts
```

---

## Routing Architecture

### Main Routes Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
  // Marketing (public)
  {
    path: '',
    loadChildren: () => import('./features/marketing/routes')
  },
  
  // Auth
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/routes')
  },
  
  // Protected routes
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/user/routes')
      },
      {
        path: 'documents',
        loadChildren: () => import('./features/documents/routes')
      },
      {
        path: 'teams',
        loadChildren: () => import('./features/teams/routes')
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/routes')
      },
      {
        path: 'subscriptions',
        loadChildren: () => import('./features/subscriptions/routes')
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/user/settings-routes')
      }
    ]
  },
  
  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/routes')
  },
  
  // Fallback
  { path: '**', redirectTo: '' }
];
```

### Route Guards

```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// core/guards/admin.guard.ts
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const user = authService.currentUser();
  
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
};

// core/guards/team-role.guard.ts
export const teamRoleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route) => {
    const teamService = inject(TeamStateService);
    const teamId = route.paramMap.get('teamId');
    const member = teamService.getCurrentMemberRole(teamId);
    
    return allowedRoles.includes(member?.role);
  };
};

// core/guards/subscription.guard.ts
export const subscriptionGuard: CanActivateFn = () => {
  const subscriptionService = inject(SubscriptionStateService);
  const router = inject(Router);
  
  if (subscriptionService.hasActiveSubscription()) {
    return true;
  }
  
  return router.createUrlTree(['/subscriptions/plans']);
};
```

### Route Resolvers

```typescript
// Pre-fetch data before route activation
export const teamResolver: ResolveFn<Team> = (route) => {
  const teamService = inject(TeamStateService);
  const teamId = route.paramMap.get('teamId')!;
  return teamService.loadTeam(teamId);
};

export const documentResolver: ResolveFn<Document> = (route) => {
  const documentService = inject(DocumentStateService);
  const docId = route.paramMap.get('documentId')!;
  return documentService.loadDocument(docId);
};
```

---

## State Management

### Signals-First Approach

```typescript
// services/document-state.service.ts
@Injectable({ providedIn: 'root' })
export class DocumentStateService {
  private readonly api = inject(ApiService);
  
  // State signals
  readonly collections = signal<Collection[]>([]);
  readonly currentCollection = signal<Collection | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  
  // Computed values
  readonly collectionCount = computed(() => this.collections().length);
  readonly totalDocuments = computed(() => 
    this.collections().reduce((sum, c) => sum + c.fileCount, 0)
  );
  
  // Effects for side effects
  constructor() {
    effect(() => {
      // Log state changes in development
      if (!environment.production) {
        console.log('Collections updated:', this.collections());
      }
    });
  }
  
  // Actions
  async loadCollections(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const collections = await firstValueFrom(
        this.api.get<Collection[]>('/documents/my-collections')
      );
      this.collections.set(collections);
    } catch (err) {
      this.error.set('Failed to load collections');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // Optimistic updates
  async deleteCollection(id: string): Promise<void> {
    const previous = this.collections();
    
    // Optimistically remove
    this.collections.update(cols => cols.filter(c => c.id !== id));
    
    try {
      await firstValueFrom(this.api.delete(`/documents/collection/${id}`));
    } catch {
      // Rollback on error
      this.collections.set(previous);
      throw new Error('Failed to delete collection');
    }
  }
}
```

### RxJS for Complex Streams

```typescript
// services/search.service.ts
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(ApiService);
  
  private readonly searchQuery$ = new Subject<string>();
  
  readonly searchResults$ = this.searchQuery$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    filter(query => query.length >= 2),
    switchMap(query => this.api.get(`/search/documents?query=${query}`)),
    shareReplay(1)
  );
  
  search(query: string): void {
    this.searchQuery$.next(query);
  }
}
```

### Optimistic UI Patterns

Optimistic UI updates provide instant feedback while API calls complete in the background.

#### Pattern 1: Optimistic Create with Rollback

```typescript
// Create with temporary ID, replace after server response
async createCollection(name: string): Promise<void> {
  const tempId = `temp-${Date.now()}`;
  const optimisticCollection: Collection = {
    id: tempId,
    name,
    fileCount: 0,
    createdAt: new Date().toISOString(),
    isOptimistic: true // UI can show loading indicator
  };
  
  // Optimistically add to list
  this.collections.update(cols => [optimisticCollection, ...cols]);
  
  try {
    const created = await firstValueFrom(
      this.api.post<Collection>('/documents/collection', { name })
    );
    // Replace temp with real
    this.collections.update(cols => 
      cols.map(c => c.id === tempId ? created : c)
    );
  } catch (error) {
    // Rollback
    this.collections.update(cols => cols.filter(c => c.id !== tempId));
    this.notification.error('Failed to create collection');
  }
}
```

#### Pattern 2: Optimistic Update with Undo

```typescript
// Allow user to undo within a time window
async renameDocument(id: string, newName: string): Promise<void> {
  const previous = this.documents().find(d => d.id === id);
  if (!previous) return;
  
  // Optimistically update
  this.documents.update(docs => 
    docs.map(d => d.id === id ? { ...d, name: newName } : d)
  );
  
  // Show undo toast
  const undoClicked = await this.notification.showUndo(
    'Document renamed',
    5000 // 5 second window
  );
  
  if (undoClicked) {
    // Revert without API call
    this.documents.update(docs => 
      docs.map(d => d.id === id ? previous : d)
    );
    return;
  }
  
  // Proceed with API call
  try {
    await firstValueFrom(
      this.api.put(`/documents/${id}`, { name: newName })
    );
  } catch {
    this.documents.update(docs => 
      docs.map(d => d.id === id ? previous : d)
    );
  }
}
```

#### Pattern 3: Conflict Resolution

```typescript
// Handle concurrent edits
async updateDocument(id: string, content: string, version: number): Promise<void> {
  const previous = this.documents().find(d => d.id === id);
  
  this.documents.update(docs => 
    docs.map(d => d.id === id ? { ...d, content, isSaving: true } : d)
  );
  
  try {
    const result = await firstValueFrom(
      this.api.put<{ conflict: boolean; serverVersion?: Document }>(
        `/documents/${id}`,
        { content, expectedVersion: version }
      )
    );
    
    if (result.conflict && result.serverVersion) {
      // Show conflict resolution dialog
      const resolution = await this.conflictDialog.open({
        local: { ...previous, content },
        server: result.serverVersion
      });
      
      if (resolution === 'keep-local') {
        await this.updateDocument(id, content, result.serverVersion.version);
      } else {
        this.documents.update(docs => 
          docs.map(d => d.id === id ? result.serverVersion : d)
        );
      }
    }
  } catch {
    this.documents.update(docs => 
      docs.map(d => d.id === id ? previous : d)
    );
  }
}
```

---

## PWA Configuration

### Service Worker Configuration

```json
// ngsw-config.json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(png|jpg|jpeg|svg|webp|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-user",
      "urls": ["/api/v1/user/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "5s"
      }
    },
    {
      "name": "api-documents",
      "urls": ["/api/v1/documents/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "30m",
        "timeout": "10s"
      }
    },
    {
      "name": "static-api",
      "urls": ["/api/v1/subscriptions/plans"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 10,
        "maxAge": "1d"
      }
    }
  ]
}
```

### Web App Manifest

```json
// manifest.webmanifest
{
  "name": "UnravelDocs - Document Processing Platform",
  "short_name": "UnravelDocs",
  "description": "Enterprise-grade document processing with OCR",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0f172a",
  "theme_color": "#0073ff",
  "icons": [
    { "src": "assets/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "assets/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "assets/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "assets/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "assets/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "assets/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "assets/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "shortcuts": [
    {
      "name": "Upload Document",
      "short_name": "Upload",
      "url": "/documents/upload",
      "icons": [{ "src": "assets/icons/upload.png", "sizes": "96x96" }]
    },
    {
      "name": "My Documents",
      "short_name": "Documents",
      "url": "/documents",
      "icons": [{ "src": "assets/icons/documents.png", "sizes": "96x96" }]
    }
  ]
}
```

### Offline Strategy

```typescript
// core/services/offline.service.ts
@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly swUpdate = inject(SwUpdate);
  
  readonly isOnline = signal(navigator.onLine);
  readonly updateAvailable = signal(false);
  
  constructor() {
    // Monitor online status
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
    
    // Handle SW updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter(evt => evt.type === 'VERSION_READY')
      ).subscribe(() => {
        this.updateAvailable.set(true);
      });
    }
  }
  
  async activateUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    document.location.reload();
  }
}
```

### Offline Document Viewing

Enable users to view previously accessed documents without network connectivity.

#### IndexedDB Document Cache

```typescript
// core/services/document-cache.service.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DocumentCacheDB extends DBSchema {
  'documents': {
    key: string;
    value: {
      id: string;
      name: string;
      content: string;
      mimeType: string;
      cachedAt: number;
      expiresAt: number;
    };
    indexes: { 'by-cached-at': number };
  };
  'pending-uploads': {
    key: string;
    value: {
      id: string;
      file: Blob;
      collectionId: string;
      createdAt: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class DocumentCacheService {
  private db: IDBPDatabase<DocumentCacheDB> | null = null;
  
  readonly cachedDocuments = signal<string[]>([]);
  readonly pendingUploads = signal<number>(0);
  
  async initialize(): Promise<void> {
    this.db = await openDB<DocumentCacheDB>('unraveldocs-cache', 1, {
      upgrade(db) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('by-cached-at', 'cachedAt');
        db.createObjectStore('pending-uploads', { keyPath: 'id' });
      }
    });
    
    await this.refreshCachedList();
    await this.cleanExpiredCache();
  }
  
  async cacheDocument(doc: Document, content: Blob): Promise<void> {
    if (!this.db) return;
    
    const contentString = await content.text();
    await this.db.put('documents', {
      id: doc.id,
      name: doc.name,
      content: contentString,
      mimeType: doc.mimeType,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await this.refreshCachedList();
  }
  
  async getCachedDocument(id: string): Promise<CachedDocument | null> {
    if (!this.db) return null;
    return await this.db.get('documents', id) ?? null;
  }
  
  async queueOfflineUpload(file: File, collectionId: string): Promise<void> {
    if (!this.db) return;
    
    await this.db.put('pending-uploads', {
      id: `pending-${Date.now()}`,
      file: file,
      collectionId,
      createdAt: Date.now()
    });
    
    this.pendingUploads.update(n => n + 1);
  }
  
  async syncPendingUploads(): Promise<void> {
    if (!this.db) return;
    
    const pending = await this.db.getAll('pending-uploads');
    for (const item of pending) {
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('collectionId', item.collectionId);
        
        await firstValueFrom(this.api.upload('/documents/upload', formData));
        await this.db.delete('pending-uploads', item.id);
        this.pendingUploads.update(n => n - 1);
      } catch {
        // Will retry on next sync
      }
    }
  }
  
  private async cleanExpiredCache(): Promise<void> {
    if (!this.db) return;
    const all = await this.db.getAll('documents');
    const now = Date.now();
    
    for (const doc of all) {
      if (doc.expiresAt < now) {
        await this.db.delete('documents', doc.id);
      }
    }
  }
}
```

#### Offline-Aware Document Viewer

```typescript
// features/documents/components/document-viewer/document-viewer.component.ts
@Component({
  selector: 'app-document-viewer',
  template: `
    @if (isOffline() && !isCached()) {
      <app-offline-banner 
        message="You're offline. This document isn't cached.">
      </app-offline-banner>
    }
    
    @if (document()) {
      <div class="viewer-container" [class.cached]="isCached()">
        @if (isCached() && isOffline()) {
          <div class="cached-indicator">
            <mat-icon>cloud_off</mat-icon>
            <span>Viewing cached version</span>
          </div>
        }
        <app-pdf-viewer [content]="documentContent()"></app-pdf-viewer>
      </div>
    }
  `
})
export class DocumentViewerComponent {
  private readonly cache = inject(DocumentCacheService);
  private readonly offline = inject(OfflineService);
  
  readonly documentId = input.required<string>();
  readonly document = signal<Document | null>(null);
  readonly documentContent = signal<string | null>(null);
  
  readonly isOffline = this.offline.isOnline.pipe(map(online => !online));
  readonly isCached = computed(() => 
    this.cache.cachedDocuments().includes(this.documentId())
  );
  
  async ngOnInit(): Promise<void> {
    if (this.offline.isOnline()) {
      await this.loadFromApi();
    } else {
      await this.loadFromCache();
    }
  }
  
  private async loadFromCache(): Promise<void> {
    const cached = await this.cache.getCachedDocument(this.documentId());
    if (cached) {
      this.document.set({ id: cached.id, name: cached.name } as Document);
      this.documentContent.set(cached.content);
    }
  }
}
```

### Push Notifications (Firebase)

```typescript
// core/services/push-notification.service.ts
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private messaging: Messaging | null = null;
  
  async initialize(): Promise<void> {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const app = initializeApp(environment.firebase);
      this.messaging = getMessaging(app);
    }
  }
  
  async requestPermission(): Promise<string | null> {
    if (!this.messaging) return null;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey
      });
    }
    return null;
  }
  
  onMessage(callback: (payload: MessagePayload) => void): void {
    if (this.messaging) {
      onMessage(this.messaging, callback);
    }
  }
}
```

---

## Internationalization (i18n)

### Setup with @angular/localize

```typescript
// app.config.ts
import { provideLocalization } from './core/i18n/localization.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLocalization(),
    // ... other providers
  ]
};
```

### Localization Provider

```typescript
// core/i18n/localization.provider.ts
import { LOCALE_ID, Provider } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';

export function provideLocalization(): Provider[] {
  // Register locales
  registerLocaleData(localeEs);
  registerLocaleData(localeFr);
  registerLocaleData(localeAr);
  
  return [
    {
      provide: LOCALE_ID,
      useFactory: () => {
        const stored = localStorage.getItem('locale');
        return stored || navigator.language || 'en';
      }
    }
  ];
}
```

### Translation Files Structure

```
assets/i18n/
├── en.json                 # English (default)
├── es.json                 # Spanish
├── fr.json                 # French
├── de.json                 # German
├── pt.json                 # Portuguese
├── ar.json                 # Arabic (RTL)
├── zh.json                 # Chinese
└── ja.json                 # Japanese
```

### Translation File Example

```json
// assets/i18n/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "auth": {
    "login": {
      "title": "Welcome Back",
      "subtitle": "Sign in to your account",
      "email": "Email address",
      "password": "Password",
      "submit": "Sign In",
      "forgot": "Forgot password?",
      "noAccount": "Don't have an account?"
    },
    "signup": {
      "title": "Create Account",
      "submit": "Create Account"
    }
  },
  "dashboard": {
    "welcome": "Welcome, {{name}}!",
    "stats": {
      "documents": "Documents",
      "ocrPages": "OCR Pages Used",
      "storage": "Storage Used"
    }
  },
  "documents": {
    "upload": {
      "title": "Upload Documents",
      "dropzone": "Drag files here or click to browse",
      "supported": "Supported: PDF, PNG, JPG, TIFF"
    }
  }
}
```

### Translation Service

```typescript
// core/i18n/translation.service.ts
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  
  private translations = signal<Record<string, any>>({});
  readonly currentLocale = signal('en');
  readonly isRtl = computed(() => ['ar', 'he', 'fa'].includes(this.currentLocale()));
  
  async loadTranslations(locale: string): Promise<void> {
    const translations = await firstValueFrom(
      this.http.get<Record<string, any>>(`/assets/i18n/${locale}.json`)
    );
    this.translations.set(translations);
    this.currentLocale.set(locale);
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = this.isRtl() ? 'rtl' : 'ltr';
  }
  
  translate(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value = keys.reduce((obj, k) => obj?.[k], this.translations());
    
    if (typeof value === 'string' && params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{{${k}}}`, String(v));
      });
    }
    
    return value ?? key;
  }
}
```

### Translate Pipe

```typescript
// shared/pipes/translate.pipe.ts
@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);
  
  transform(key: string, params?: Record<string, any>): string {
    return this.translationService.translate(key, params);
  }
}
```

### Usage in Templates

```html
<!-- Simple translation -->
<h1>{{ 'auth.login.title' | translate }}</h1>

<!-- With parameters -->
<p>{{ 'dashboard.welcome' | translate: { name: user.firstName } }}</p>

<!-- In attributes -->
<input [placeholder]="'auth.login.email' | translate">
```

### Date & Currency Formatting

```typescript
// shared/pipes/localized-date.pipe.ts
@Pipe({ name: 'localizedDate', standalone: true })
export class LocalizedDatePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  
  transform(value: Date | string, format: string = 'mediumDate'): string {
    return formatDate(value, format, this.locale);
  }
}

// shared/pipes/localized-currency.pipe.ts
@Pipe({ name: 'localizedCurrency', standalone: true })
export class LocalizedCurrencyPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  
  transform(value: number, currency: string = 'USD'): string {
    return formatCurrency(value, this.locale, getCurrencySymbol(currency, 'narrow'), currency);
  }
}
```

---

## Component Specifications

### Shared UI Components (60+)

#### Base Components
| Component | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| `ButtonComponent` | Primary button | `variant`, `size`, `loading`, `disabled` | `clicked` |
| `InputComponent` | Form input | `type`, `placeholder`, `error` | `valueChange` |
| `SelectComponent` | Dropdown select | `options`, `placeholder` | `selectionChange` |
| `CheckboxComponent` | Checkbox input | `checked`, `indeterminate` | `checkedChange` |
| `SwitchComponent` | Toggle switch | `checked`, `disabled` | `checkedChange` |
| `TextareaComponent` | Multiline input | `rows`, `maxLength` | `valueChange` |
| `BadgeComponent` | Status badge | `variant`, `size` | - |
| `AvatarComponent` | User avatar | `src`, `name`, `size` | - |
| `CardComponent` | Content card | `elevation`, `padding` | - |
| `TooltipDirective` | Hover tooltip | `content`, `position` | - |

#### Feedback Components
| Component | Description |
|-----------|-------------|
| `ToastComponent` | Notification toast |
| `AlertComponent` | Inline alert |
| `ProgressComponent` | Progress indicator |
| `SpinnerComponent` | Loading spinner |
| `SkeletonComponent` | Loading placeholder |
| `EmptyStateComponent` | No data display |
| `ErrorStateComponent` | Error display |

#### Navigation Components
| Component | Description |
|-----------|-------------|
| `BreadcrumbComponent` | Page breadcrumbs |
| `TabsComponent` | Tab navigation |
| `StepperComponent` | Multi-step wizard |
| `PaginationComponent` | Page navigation |
| `MenuComponent` | Dropdown menu |

#### Layout Components
| Component | Description |
|-----------|-------------|
| `NavbarComponent` | Top navigation |
| `SidebarComponent` | Side navigation |
| `FooterComponent` | Page footer |
| `PageHeaderComponent` | Page title area |
| `ContainerComponent` | Content wrapper |
| `GridComponent` | Responsive grid |

#### Form Components
| Component | Description |
|-----------|-------------|
| `FormFieldComponent` | Form field wrapper |
| `PasswordInputComponent` | Password with toggle |
| `OtpInputComponent` | 6-digit OTP input |
| `FileUploadComponent` | File upload zone |
| `DatePickerComponent` | Date selection |
| `SearchInputComponent` | Search with debounce |
| `CurrencySelectorComponent` | Currency dropdown |

---

## Services & API Integration

### Core Services (15+)

| Service | Purpose |
|---------|---------|
| `ApiService` | HTTP client wrapper |
| `AuthService` | Authentication logic |
| `StorageService` | Local/session storage |
| `WebSocketService` | Real-time connections |
| `NotificationService` | Toast notifications |
| `OfflineService` | PWA offline handling |
| `PushNotificationService` | Firebase FCM |
| `TranslationService` | i18n translations |
| `ThemeService` | Dark/light mode |
| `AnalyticsService` | User analytics |
| `ErrorHandlerService` | Global error handling |
| `LoggingService` | Application logging |
| `CacheService` | Response caching |
| `PermissionService` | Feature permissions |
| `ConfigService` | Runtime config |

### API Service

```typescript
// core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(map(response => response.data));
  }
  
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(map(response => response.data));
  }
  
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(map(response => response.data));
  }
  
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`)
      .pipe(map(response => response.data));
  }
  
  upload(endpoint: string, formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post(`${this.baseUrl}${endpoint}`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
```

### HTTP Interceptors

```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next(req);
};

// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      } else if (error.status === 429) {
        notification.error('Too many requests. Please slow down.');
      } else if (error.status >= 500) {
        notification.error('Server error. Please try again later.');
      }
      return throwError(() => error);
    })
  );
};
```

---

## Real-Time Features

### WebSocket Service

```typescript
// core/services/websocket.service.ts
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly messages$ = new Subject<WebSocketMessage>();
  
  readonly connectionStatus = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  connect(url: string): void {
    this.connectionStatus.set('connecting');
    this.socket = new WebSocket(url);
    
    this.socket.onopen = () => this.connectionStatus.set('connected');
    this.socket.onclose = () => this.connectionStatus.set('disconnected');
    this.socket.onmessage = (event) => {
      this.messages$.next(JSON.parse(event.data));
    };
  }
  
  send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
  
  onMessage<T>(type: string): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.type === type),
      map(msg => msg.payload as T)
    );
  }
  
  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }
}
```

### Real-Time Notifications

```typescript
// features/user/services/realtime-notifications.service.ts
@Injectable({ providedIn: 'root' })
export class RealtimeNotificationsService {
  private readonly ws = inject(WebSocketService);
  private readonly auth = inject(AuthService);
  
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => 
    this.notifications().filter(n => !n.read).length
  );
  
  initialize(): void {
    const token = this.auth.accessToken();
    this.ws.connect(`${environment.wsUrl}?token=${token}`);
    
    this.ws.onMessage<AppNotification>('notification').subscribe(notification => {
      this.notifications.update(list => [notification, ...list]);
    });
    
    this.ws.onMessage<DocumentUpdate>('document_updated').subscribe(update => {
      // Handle document updates
    });
  }
}
```

---

## Design System

### Color Palette

```scss
// styles/_variables.scss
:root {
  // Primary - Deep Ocean Blue
  --primary-50: #e6f1ff;
  --primary-100: #cce3ff;
  --primary-500: #0073ff;
  --primary-600: #005ccc;
  --primary-900: #001733;

  // Accent - Emerald
  --accent-50: #ecfdf5;
  --accent-500: #10b981;
  --accent-600: #059669;

  // Neutral - Slate  
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-500: #64748b;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;

  // Status
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}

// Dark mode
[data-theme="dark"] {
  --neutral-50: #0f172a;
  --neutral-100: #1e293b;
  --neutral-800: #f1f5f9;
  --neutral-900: #f8fafc;
}
```

### Typography

```scss
// styles/_typography.scss
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  --font-size-xs: 0.75rem;    // 12px
  --font-size-sm: 0.875rem;   // 14px
  --font-size-base: 1rem;     // 16px
  --font-size-lg: 1.125rem;   // 18px
  --font-size-xl: 1.25rem;    // 20px
  --font-size-2xl: 1.5rem;    // 24px
  --font-size-3xl: 1.875rem;  // 30px
  --font-size-4xl: 2.25rem;   // 36px
}
```

---

## Testing Strategy

### Unit Tests (Jest)

```typescript
// features/auth/pages/login/login.component.spec.ts
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jest.Mocked<AuthService>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: createMockAuthService() }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
  });
  
  it('should login successfully with valid credentials', async () => {
    authService.login.mockResolvedValue({ accessToken: 'token' });
    
    component.form.setValue({ email: 'test@example.com', password: 'password' });
    await component.onSubmit();
    
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });
});
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:ci
      
      - name: Build
        run: npm run build:prod
      
      - name: E2E tests
        run: npm run e2e

  deploy-staging:
    needs: build-and-test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to Staging
        run: echo "Deploy to staging environment"
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup with Angular 21
- [ ] Core module (guards, interceptors, services)
- [ ] Shared module (UI components)
- [ ] Design system & theming
- [ ] PWA configuration
- [ ] i18n setup with English

### Phase 2: Authentication (Week 3)
- [ ] Auth module pages
- [ ] Login, signup, verification flows
- [ ] Password reset flow
- [ ] Social login integration
- [ ] Token management

### Phase 3: Dashboard & Documents (Week 4-5)
- [ ] User dashboard
- [ ] Document upload
- [ ] Collection management
- [ ] Document viewer
- [ ] OCR processing UI

### Phase 4: Teams & Subscriptions (Week 6-7)
- [ ] Team creation wizard
- [ ] Team management pages
- [ ] Member management
- [ ] Subscription pages
- [ ] Payment integration

### Phase 5: Admin Dashboard (Week 8-9)
- [ ] Admin layout
- [ ] User management
- [ ] Document management
- [ ] Payment management
- [ ] Analytics dashboards

### Phase 6: Marketing & Polish (Week 10)
- [ ] Landing page
- [ ] Pricing page
- [ ] Additional translations
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 7: Testing & Launch (Week 11-12)
- [ ] Unit test coverage (80%+)
- [ ] E2E test suite
- [ ] Security review
- [ ] Documentation
- [ ] Production deployment

---

## Summary

This Angular 21 implementation plan provides:

| Feature | Technology |
|---------|------------|
| **Framework** | Angular 21 (standalone components) |
| **State** | Angular Signals + RxJS |
| **Charts** | ng2-charts (Chart.js) + optional ngx-charts |
| **PWA** | @angular/pwa with offline support |
| **i18n** | @angular/localize with 8+ languages |
| **Real-time** | WebSocket service + Firebase FCM |
| **Testing** | Jest + Playwright |

The modular architecture with 8 feature modules enables:
- Lazy loading for optimal performance
- Clear separation of concerns
- Scalable team development
- Easy maintenance and testing
