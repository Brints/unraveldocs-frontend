# Features Component

A modern, animated features showcase component for displaying product/service features.

## Overview

The Features Component displays a grid of feature cards with icons, descriptions, and benefits. Each card is interactive and includes smooth animations.

## Features

- ✅ Responsive grid layout (1-3 columns based on screen size)
- ✅ Smooth hover animations and transitions
- ✅ Accessible (keyboard navigation, ARIA labels)
- ✅ Customizable feature data
- ✅ Click events for analytics tracking
- ✅ Modern design with gradient accents
- ✅ Staggered entrance animations
- ✅ Reduced motion support

## Usage

```typescript
import { FeaturesComponent } from './shared/components/features/features.component';

// In your component
@Component({
  imports: [FeaturesComponent]
})
```

```html
<app-features
  (featureClicked)="onFeatureClick($event)">
</app-features>
```

## API

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `lazyLoad` | boolean | `true` | Enable lazy loading for images |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `featureClicked` | `EventEmitter<string>` | Emitted when a feature card is clicked |
| `imageLoad` | `EventEmitter<string>` | Emitted when an image loads successfully |
| `imageError` | `EventEmitter<string>` | Emitted when an image fails to load |

## Feature Data Structure

```typescript
interface Feature {
  id: string;           // Unique identifier
  icon: string;         // Emoji or icon character
  title: string;        // Feature title
  description: string;  // Feature description
  color: string;        // Tailwind color class
  benefits?: string[];  // Optional list of benefits
  image?: string;       // Optional image URL
}
```

## Customization

To customize the features, edit the `features` signal in `features.component.ts`:

```typescript
features = signal<Feature[]>([
  {
    id: 'custom-feature',
    icon: '🎨',
    title: 'Your Feature',
    description: 'Feature description',
    color: 'bg-blue-500',
    benefits: ['Benefit 1', 'Benefit 2']
  }
]);
```

## Styling

The component uses:
- Tailwind CSS for utility classes
- Custom CSS for animations and effects
- CSS variables for easy theming

## Accessibility

- Keyboard navigable (Tab, Enter, Space)
- ARIA labels for screen readers
- Focus indicators
- Reduced motion support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11 not supported (uses modern CSS features)

