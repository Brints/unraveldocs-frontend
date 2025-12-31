import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const documentRoutes: Routes = [
  {
    path: 'documents',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/documents-list/documents-list.component')
          .then(m => m.DocumentsListComponent),
        title: 'My Documents - UnravelDocs'
      },
      {
        path: 'upload',
        loadComponent: () => import('./components/document-upload/document-upload.component')
          .then(m => m.DocumentUploadComponent),
        title: 'Upload Documents - UnravelDocs'
      },
      {
        path: 'collection/:collectionId',
        loadComponent: () => import('./components/collection-detail/collection-detail.component')
          .then(m => m.CollectionDetailComponent),
        title: 'Collection - UnravelDocs'
      }
    ]
  }
];

