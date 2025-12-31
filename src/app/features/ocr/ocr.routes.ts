import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const ocrRoutes: Routes = [
  {
    path: 'ocr',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/ocr-processing/ocr-processing.component')
          .then(m => m.OcrProcessingComponent),
        title: 'OCR Processing - UnravelDocs'
      }
    ]
  }
];

