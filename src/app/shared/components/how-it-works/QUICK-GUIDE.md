# How It Works - Quick Customization Guide

## 🎨 Quick Style Changes

### Change Step Colors
Edit `how-it-works.component.ts` lines 33-58:

```typescript
{
  color: '#YOUR_COLOR',           // Primary color
  gradient: 'linear-gradient(...)', // Gradient background
}
```

### Change Step Content
Edit the `steps` array in `how-it-works.component.ts`:

```typescript
{
  title: 'Your Step Title',
  description: 'Your description text...',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  duration: 'Your timing'
}
```

### Change Background Color
Edit `how-it-works.component.css` line 2:

```css
.how-it-works-section {
  background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

## 🔧 Add/Remove Steps

### Add a New Step
In `how-it-works.component.ts`, add to the `steps` array:

```typescript
{
  id: '4',
  title: 'New Step',
  description: 'Step description',
  icon: '<svg>...</svg>',
  color: '#ff6b6b',
  gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  duration: 'Time'
}
```

Update CSS for 4-column grid at line 54:

```css
@media (min-width: 1024px) {
  .steps-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## 📱 Responsive Tweaks

### Adjust Mobile Layout
Edit breakpoints in `how-it-works.component.css` at line 555:

```css
@media (max-width: 768px) {
  /* Your mobile styles */
}
```

## 🎬 Animation Speed

### Adjust Animation Duration
Find and edit in CSS:

```css
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
/* Change 0.4s to your preferred duration */
```

## 🎯 Disable Animations

Add to CSS:

```css
* {
  animation: none !important;
  transition: none !important;
}
```

## 💡 Tips

- Keep step descriptions under 120 characters
- Use 3 features per step for consistency
- Icons should be simple and recognizable
- Test on mobile devices for touch interactions
- Maintain color contrast for accessibility

## 🚀 Common Customizations

### Change Upload Zone Text
Edit `how-it-works.component.html` lines 130-132

### Modify Format Badges
Edit lines 136-141

### Update Feature Icons
Replace SVG paths in the template

---

Need more help? Check the full documentation in `ENHANCEMENT-README.md`

