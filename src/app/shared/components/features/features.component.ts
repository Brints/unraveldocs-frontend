import { Component, Input, Output, EventEmitter, signal } from '@angular/core';


export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  benefits?: string[];
  image?: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent {
  @Input() lazyLoad = true;
  @Output() featureClicked = new EventEmitter<string>();
  @Output() imageLoad = new EventEmitter<string>();
  @Output() imageError = new EventEmitter<string>();

  features = signal<Feature[]>([
    {
      id: 'ai-powered',
      icon: '🤖',
      title: 'AI-Powered Analysis',
      description: 'Advanced AI algorithms analyze your documents and extract key insights automatically.',
      color: 'bg-blue-500',
      benefits: [
        'Smart content extraction',
        'Automatic categorization',
        'Intelligent suggestions'
      ]
    },
    {
      id: 'real-time',
      icon: '⚡',
      title: 'Real-Time Collaboration',
      description: 'Work together with your team in real-time with instant updates and seamless sync.',
      color: 'bg-purple-500',
      benefits: [
        'Live editing',
        'Team notifications',
        'Version control'
      ]
    },
    {
      id: 'security',
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Bank-level encryption and security protocols to keep your documents safe.',
      color: 'bg-green-500',
      benefits: [
        'End-to-end encryption',
        'SOC 2 compliant',
        'Regular backups'
      ]
    },
    {
      id: 'integration',
      icon: '🔗',
      title: 'Seamless Integration',
      description: 'Connect with your favorite tools and services for a unified workflow.',
      color: 'bg-orange-500',
      benefits: [
        'API access',
        'Webhook support',
        '100+ integrations'
      ]
    },
    {
      id: 'analytics',
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Get detailed insights and analytics about your document usage and performance.',
      color: 'bg-indigo-500',
      benefits: [
        'Usage metrics',
        'Performance reports',
        'Custom dashboards'
      ]
    },
    {
      id: 'search',
      icon: '🔍',
      title: 'Smart Search',
      description: 'Find anything instantly with powerful search across all your documents.',
      color: 'bg-pink-500',
      benefits: [
        'Full-text search',
        'Filter options',
        'Search history'
      ]
    }
  ]);

  onFeatureClick(featureId: string): void {
    this.featureClicked.emit(featureId);
  }
}

