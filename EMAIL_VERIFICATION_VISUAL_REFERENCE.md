# Email Verification Visual Reference

## Component States

### 1. Loading State
```
┌─────────────────────────────────────┐
│         [Logo]                      │
│   Email Verification                │
│                                     │
│  ┌───────────────────────────┐     │
│  │                           │     │
│  │    [Spinning Loader]      │     │
│  │                           │     │
│  │  Verifying your email...  │     │
│  │  Please wait while we     │     │
│  │  confirm your email       │     │
│  │                           │     │
│  └───────────────────────────┘     │
└─────────────────────────────────────┘
```

### 2. Success State
```
┌─────────────────────────────────────┐
│         [Logo]                      │
│   Email Verification                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✓ Email Verified Successfully!│ │ ← Green gradient header
│  ├───────────────────────────────┤ │
│  │ ✓ Your email has been         │ │
│  │   successfully verified       │ │
│  │                               │ │
│  │ ✓ You can now access all      │ │
│  │   features of your account    │ │
│  │                               │ │
│  │ ─────────────────────────────│ │
│  │ Redirecting to login in 5s... │ │
│  │                               │ │
│  │  [Sign In Now →]              │ │ ← Primary button
│  └───────────────────────────────┘ │
│                                     │
│  Need help? Contact Support         │
│  Terms • Privacy                    │
└─────────────────────────────────────┘
```

### 3. Error State
```
┌─────────────────────────────────────┐
│         [Logo]                      │
│   Email Verification                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⚠ Verification Failed         │ │ ← Red gradient header
│  ├───────────────────────────────┤ │
│  │ ┌─────────────────────────┐   │ │
│  │ │ This verification link  │   │ │ ← Red error box
│  │ │ has expired. Please     │   │ │
│  │ │ request a new one.      │   │ │
│  │ └─────────────────────────┘   │ │
│  │                               │ │
│  │ ┌─────────────────────────┐   │ │
│  │ │ ✓ Verification email    │   │ │ ← Green success (if resent)
│  │ │   has been resent to    │   │ │
│  │ │   user@example.com      │   │ │
│  │ └─────────────────────────┘   │ │
│  │                               │ │
│  │ What would you like to do?    │ │
│  │                               │ │
│  │  [📧 Resend Verification]     │ │ ← Primary button
│  │                               │ │
│  │  [Back to Login] [Sign Up]    │ │ ← Secondary buttons
│  └───────────────────────────────┘ │
│                                     │
│  Need help? Contact Support         │
│  Terms • Privacy                    │
└─────────────────────────────────────┘
```

## Color Scheme

### Success State
- **Header**: Gradient from green-500 to emerald-600
- **Background**: White with green-100 border
- **Text**: Gray-700 for body, white for header
- **Icons**: Green-500
- **Button**: Gradient from blue-600 to indigo-600

### Error State
- **Header**: Gradient from red-500 to rose-600
- **Background**: White with red-100 border
- **Error Box**: Red-50 background with red-200 border
- **Success Box**: Green-50 background with green-200 border
- **Text**: Red-800 for errors, green-800 for success
- **Icons**: Red-500 for error, green-500 for success
- **Buttons**: Blue-600 primary, gray-300 secondary

### Loading State
- **Spinner**: Blue-600 with blue-100 base
- **Background**: White with gray-100 border
- **Text**: Gray-900 for heading, gray-500 for description

## Typography

- **Main Heading**: 3xl, extrabold, gray-900
- **Subheading**: sm, gray-600
- **Card Title**: lg, semibold, white (on colored background)
- **Body Text**: sm, gray-700
- **Error Text**: sm, red-800, medium
- **Success Text**: sm, green-800, medium
- **Button Text**: sm, medium

## Spacing

- **Container**: max-w-md
- **Padding**: px-6 py-5 for card body
- **Margin**: space-y-8 for main sections
- **Gap**: gap-3 for button groups

## Animations

### Loading Spinner
- Continuous rotation
- Dual-ring design
- Pulse effect on outer ring

### Success Card
- Fade-in on appear (0.5s)
- Checkmark scale animation
- Countdown number change

### Error Card
- Fade-in on appear (0.5s)
- Shake animation on error icon
- Slide-in for success banner

### Buttons
- Hover scale (1.05)
- Shadow increase on hover
- Color transition (0.2s)
- Disabled state: opacity 50%

## Responsive Breakpoints

### Mobile (< 640px)
- Full-width cards
- Stacked buttons
- Smaller padding
- Adjusted font sizes

### Tablet (640px - 1024px)
- Constrained width (max-w-md)
- Side-by-side buttons where appropriate
- Standard padding

### Desktop (> 1024px)
- Centered layout
- Standard spacing
- Hover effects enabled

## Icon Usage

### Success Icons
- ✓ Checkmark in circle (main success)
- ✓ Small checkmarks (feature list)
- → Arrow (button)
- 📧 Mail icon (resend button)

### Error Icons
- ⚠ Warning triangle
- 📧 Mail icon (resend)
- ← Back arrow
- 👤 User icon (sign up)

### Common Icons
- 🔄 Loading spinner
- 📧 Email support
- 🔗 Link icons

## Interaction States

### Buttons
- **Default**: Full color, shadow
- **Hover**: Darker color, larger shadow, scale 1.05
- **Active**: Slightly darker, scale 0.98
- **Disabled**: 50% opacity, no pointer events
- **Loading**: Spinner icon, disabled state

### Links
- **Default**: Blue-600
- **Hover**: Blue-500
- **Focus**: Ring-2 blue-500

## Accessibility

- Semantic HTML (button, a, h1-h3)
- ARIA labels where needed
- Sufficient color contrast (WCAG AA)
- Keyboard navigation support
- Focus visible states
- Screen reader friendly

## Email Verification URL Format

```
https://yourdomain.com/auth/verify-email?token=abc123&email=user@example.com
```

**Parameters:**
- `token`: Verification token from email
- `email`: User's email address (URL encoded)

## API Integration

### Success Response (200)
```json
{
  "statusCode": 200,
  "message": "Email verified successfully"
}
```

### Error Responses

**404 - User Not Found**
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "User does not exist."
}
```

**400 - Invalid Token**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid email verification token."
}
```

**400 - Expired Token**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Email verification token has expired."
}
```

---

**Note**: This visual reference uses ASCII art for demonstration. The actual component uses modern web UI with gradients, shadows, and smooth animations.

