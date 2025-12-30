import {Routes} from '@angular/router';
import {TermsComponent} from './components/terms/terms.component';
import {PrivacyPolicyComponent} from './components/privacy-policy/privacy-policy.component';

export const privacyRoutes: Routes = [
  {
    path: 'terms',
    component: TermsComponent,
    title: 'UnravelDocs | Terms & Conditions'
  },
  {
    path: 'privacy',
    component: PrivacyPolicyComponent,
    title: 'UnravelDocs | Privacy Policy'
  }
]
