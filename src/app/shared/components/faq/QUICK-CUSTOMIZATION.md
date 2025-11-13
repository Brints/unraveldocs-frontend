# FAQ Component - Quick Customization Guide

## 🎨 Common Customizations

### 1. Change Colors

**Primary Blue:**
```css
/* Find and replace in faq.component.css */
#3b82f6 → YOUR_COLOR
#2563eb → YOUR_DARKER_SHADE
```

**Purple Accent:**
```css
#8b5cf6 → YOUR_ACCENT_COLOR
```

**Background:**
```css
/* Line 3 in CSS */
background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
```

---

### 2. Add New FAQ

In `faq.component.ts`, add to the `faqs` array:

```typescript
{
  id: '11',
  category: 'features', // or: general, pricing, security, support
  question: 'Your question here?',
  answer: 'Your detailed answer goes here...',
  isOpen: false,
  icon: '🎯', // Any emoji
  tags: ['tag1', 'tag2', 'tag3']
}
```

**Don't forget** to update the category count by running the component!

---

### 3. Add New Category

**Step 1:** Add to `categories` array:
```typescript
{ 
  id: 'integrations', 
  name: 'Integrations', 
  icon: '🔌', 
  count: 0 
}
```

**Step 2:** Add FAQs with `category: 'integrations'`

**Step 3:** Counts update automatically!

---

### 4. Modify Search Behavior

**Disable Search:**
```html
<app-faq [searchable]="false"></app-faq>
```

**Search Only Questions:**
```typescript
// In filteredFAQs computed, line 149, remove:
|| faq.answer.toLowerCase().includes(term)
|| faq.tags?.some(tag => tag.toLowerCase().includes(term))
```

---

### 5. Change Animation Speed

**Entrance Animations:**
```css
/* Line 297 in CSS */
.faq-item {
  animation: fadeInUp 0.5s ease-out backwards;
  /* Change 0.5s to your preferred duration */
}
```

**Toggle Animation:**
```css
/* Line 414 in CSS */
.toggle-icon {
  transition: all 0.3s ease;
  /* Change 0.3s */
}
```

**Expand/Collapse:**
```css
/* Line 436 in CSS */
.faq-answer {
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  /* Change 0.4s */
}
```

---

### 6. Disable All Animations

Add this CSS:
```css
* {
  animation: none !important;
  transition: none !important;
}
```

Or use the existing reduced motion support (automatic).

---

### 7. Change Default Open Category

```typescript
// Line 34 in faq.component.ts
selectedCategory = signal<string>('general'); // Instead of 'all'
```

---

### 8. Open First FAQ by Default

```typescript
// In faqs array, set first item:
isOpen: true
```

---

### 9. Customize CTA Section

**Change Text:**
```html
<!-- In faq.component.html, lines 131-151 -->
<h3 class="cta-title">Your custom title</h3>
<p class="cta-description">Your custom description</p>
```

**Change Button Text:**
```html
<button class="btn-primary">
  Your Button Text
</button>
```

**Remove CTA Section:**
```html
<!-- Delete or comment out lines 127-154 in HTML -->
```

---

### 10. Adjust Max Width

**FAQ List:**
```css
/* Line 221 in CSS */
.faq-grid {
  max-width: 56rem; /* Change this value */
}
```

**Search Bar:**
```css
/* Line 111 in CSS */
.search-container {
  max-width: 48rem; /* Change this value */
}
```

---

### 11. Change Section Padding

```css
/* Line 2 in CSS */
.faq-section {
  padding: 6rem 0; /* Vertical padding */
}

/* Mobile: Line 626 */
@media (max-width: 768px) {
  .faq-section {
    padding: 4rem 0;
  }
}
```

---

### 12. Modify Icon Size

**Question Icons:**
```css
/* Line 383 in CSS */
.question-icon {
  font-size: 1.75rem; /* Change size */
}
```

**Category Icons:**
```css
/* Line 187 in CSS */
.category-icon {
  font-size: 1.125rem; /* Change size */
}
```

---

### 13. Track Analytics

**Listen to Events:**
```typescript
// In your parent component
<app-faq (questionClicked)="trackFaqClick($event)"></app-faq>

trackFaqClick(faqId: string) {
  // Send to analytics
  console.log('FAQ clicked:', faqId);
  gtag('event', 'faq_click', { faq_id: faqId });
}
```

---

### 14. Change Tags Display

**Hide Tags:**
```html
<!-- Remove lines 113-119 in HTML -->
```

**Style Tags Differently:**
```css
/* Line 457 in CSS */
.tag {
  background: YOUR_COLOR;
  color: YOUR_TEXT_COLOR;
  border-radius: YOUR_RADIUS;
}
```

---

### 15. Modify Hover Effects

**Reduce Lift Effect:**
```css
/* Line 311 in CSS */
.faq-item:hover {
  transform: translateY(-2px); /* Instead of -4px */
}
```

**Remove Hover Border:**
```css
/* Line 310 in CSS */
.faq-item:hover {
  border-color: transparent; /* Remove color change */
}
```

---

## 🚀 Quick Tips

1. **Keep answers concise** - Under 150 words works best
2. **Use clear questions** - User's actual language
3. **Add relevant tags** - Helps with search
4. **Group logically** - Use categories wisely
5. **Test search** - Make sure tags work well
6. **Monitor clicks** - Track popular questions
7. **Update regularly** - Add new FAQs as needed

---

## 🐛 Troubleshooting

**Search not working?**
- Check that tags array exists
- Verify searchTerm signal is updating

**Categories showing 0?**
- Ensure `updateCategoryCounts()` runs in constructor
- Check category IDs match FAQ categories

**Animations choppy?**
- Check browser performance
- Reduce animation duration
- Enable GPU acceleration

**Layout issues?**
- Check responsive breakpoints
- Verify max-width values
- Test on actual devices

---

## 📚 More Help

See `FAQ-ENHANCEMENT.md` for complete documentation.

---

## ✅ Testing Checklist

- [ ] All FAQs display correctly
- [ ] Search filters work
- [ ] Categories filter work
- [ ] Both filters work together
- [ ] Expand/collapse smooth
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] No console errors
- [ ] Animations smooth

---

**Need more help? Check the full documentation!** 📖

