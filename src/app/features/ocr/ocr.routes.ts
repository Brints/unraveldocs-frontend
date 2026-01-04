import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const ocrRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../user/components/dashboard-layout/dashboard-layout.component')
      .then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'ocr',
        loadComponent: () => import('./components/ocr-processing/ocr-processing.component')
          .then(m => m.OcrProcessingComponent),
        title: 'OCR Processing - UnravelDocs'
      }
    ]
  }
];

