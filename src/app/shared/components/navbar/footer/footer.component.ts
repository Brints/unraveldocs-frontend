import { Component, Output, EventEmitter } from '@angular/core';
import { Logo } from '../../logo/logo';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [Logo],
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.css']
})

export class FooterComponent {
  @Output() newsletterSignup = new EventEmitter<string>();
  @Output() linkClicked = new EventEmitter<string>();

  currentYear = new Date().getFullYear();

  linkGroups = [
    {
      title: 'Product',
      links: [
        { text: 'Features', href: '#features' },
        { text: 'Pricing', href: '#pricing' },
        { text: 'How It Works', href: '#how-it-works' },
        { text: 'API', href: '#api' }
      ]
    },
    {
      title: 'Company',
      links: [
        { text: 'About Us', href: '#about' },
        { text: 'Careers', href: '#careers' },
        { text: 'Contact', href: '#contact' },
        { text: 'Blog', href: '#blog' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', href: '#privacy' },
        { text: 'Terms of Service', href: '#terms' },
        { text: 'Cookie Policy', href: '#cookies' },
        { text: 'GDPR', href: '#gdpr' }
      ]
    }
  ];

  onNewsletterSignup(email: string): void {
    this.newsletterSignup.emit(email);
  }

  onLinkClick(linkId: string): void {
    this.linkClicked.emit(linkId);
  }
}
