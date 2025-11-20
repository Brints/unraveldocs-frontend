# Testing Guide: Multi-Step Signup Form

## Quick Test Checklist

### ✅ Step 1 Validation Tests

1. **Empty Form Test**
   - [ ] Try clicking "Next Step" without filling any fields
   - [ ] Verify button is disabled
   - [ ] Check that validation hint appears

2. **Partial Completion Test**
   - [ ] Fill only first name and last name
   - [ ] Verify "Next Step" still disabled
   - [ ] Fill email address
   - [ ] Verify still disabled until all required fields complete

3. **Password Validation**
   - [ ] Enter weak password (e.g., "12345")
   - [ ] Verify password strength indicator shows "Weak"
   - [ ] Enter strong password
   - [ ] Verify strength indicator shows "Strong"
   - [ ] Enter different password in confirm field
   - [ ] Verify error message appears

4. **Email Validation**
   - [ ] Enter invalid email (e.g., "test@")
   - [ ] Verify error message
   - [ ] Enter valid email
   - [ ] Verify error clears

5. **Country Selection**
   - [ ] Leave country unselected
   - [ ] Verify "Next Step" disabled
   - [ ] Select a country
   - [ ] Verify "Next Step" becomes enabled

6. **Next Step Navigation**
   - [ ] Complete all Step 1 fields correctly
   - [ ] Verify "Next Step" button is enabled
   - [ ] Click "Next Step"
   - [ ] Verify smooth slide animation to Step 2
   - [ ] Verify step indicator shows Step 1 as completed (green check)
   - [ ] Verify Step 2 is now highlighted

### ✅ Step 2 Validation Tests

7. **Terms Acceptance**
   - [ ] On Step 2, verify "Create Account" button is disabled
   - [ ] Check the Terms & Conditions checkbox
   - [ ] Verify "Create Account" button becomes enabled

8. **Optional Fields**
   - [ ] Leave Profession empty
   - [ ] Verify "Create Account" button still enabled
   - [ ] Leave Company empty
   - [ ] Verify "Create Account" button still enabled

9. **Back Navigation**
   - [ ] Click "Back" button
   - [ ] Verify smooth slide animation back to Step 1
   - [ ] Verify all Step 1 data is still filled in
   - [ ] Verify step indicator updates correctly

10. **Marketing Opt-in**
    - [ ] Toggle marketing checkbox on/off
    - [ ] Verify it doesn't affect form validity

### ✅ Complete Flow Tests

11. **Full Signup Flow**
    - [ ] Fill all Step 1 required fields
    - [ ] Click "Next Step"
    - [ ] Fill Step 2 fields (profession optional)
    - [ ] Accept terms
    - [ ] Click "Create Account"
    - [ ] Verify loading state appears
    - [ ] Verify success modal appears on completion

12. **Data Persistence**
    - [ ] Fill Step 1 completely
    - [ ] Go to Step 2
    - [ ] Go back to Step 1
    - [ ] Verify all data is still there
    - [ ] Return to Step 2
    - [ ] Verify Step 2 data preserved

13. **Error Handling**
    - [ ] Enter an email that already exists
    - [ ] Complete both steps and submit
    - [ ] Verify error message appears
    - [ ] Verify error clears when modifying email

### ✅ Google Signup Tests

14. **Google Integration**
    - [ ] Click "Sign up with Google" button
    - [ ] Verify multi-step form is bypassed
    - [ ] Complete Google auth flow
    - [ ] Verify redirect to dashboard

### ✅ Password Generator Tests

15. **Generator Functionality**
    - [ ] Click "Generate secure password"
    - [ ] Verify modal appears
    - [ ] Generate a password
    - [ ] Verify both password fields are filled
    - [ ] Verify password strength indicator updates
    - [ ] Verify modal closes

### ✅ Responsive Design Tests

16. **Mobile View (< 480px)**
    - [ ] Open in mobile viewport
    - [ ] Verify step indicator is compact
    - [ ] Verify form fields are full width
    - [ ] Verify buttons on Step 2 are side-by-side
    - [ ] Test complete signup flow on mobile

17. **Tablet View (768px)**
    - [ ] Open in tablet viewport
    - [ ] Verify layout adapts appropriately
    - [ ] Test complete signup flow

18. **Desktop View (> 1024px)**
    - [ ] Open in desktop viewport
    - [ ] Verify optimal spacing and sizing
    - [ ] Test complete signup flow

### ✅ Animation Tests

19. **Smooth Transitions**
    - [ ] Navigate between steps multiple times
    - [ ] Verify no flickering or jumps
    - [ ] Verify 400ms smooth animation
    - [ ] Check transitions feel natural

20. **Reduced Motion**
    - [ ] Enable "prefers-reduced-motion" in browser
    - [ ] Navigate between steps
    - [ ] Verify animations are minimal/instant

### ✅ Accessibility Tests

21. **Keyboard Navigation**
    - [ ] Tab through all fields in order
    - [ ] Verify focus states are visible
    - [ ] Press Enter on "Next Step" button
    - [ ] Verify it advances to Step 2
    - [ ] Tab through Step 2 fields
    - [ ] Press Enter on "Create Account"

22. **Screen Reader**
    - [ ] Use screen reader to navigate form
    - [ ] Verify all labels are read correctly
    - [ ] Verify error messages are announced
    - [ ] Verify step indicator is understandable

### ✅ Edge Cases

23. **Browser Back Button**
    - [ ] Complete Step 1
    - [ ] Go to Step 2
    - [ ] Click browser back button
    - [ ] Verify behavior is appropriate

24. **Form Reset**
    - [ ] Complete signup successfully
    - [ ] Verify form resets to Step 1
    - [ ] Verify all fields are cleared

25. **Network Errors**
    - [ ] Disable network
    - [ ] Try to submit form
    - [ ] Verify error message appears
    - [ ] Re-enable network
    - [ ] Retry submission

## Test Data

### Valid Test User
```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Password: StrongP@ss123!
Country: United States
Profession: Software Engineer
Company: Tech Corp
Terms: Accepted
Marketing: Optional
```

### Invalid Scenarios

**Weak Password:**
```
Password: 123456
Expected: Validation error, cannot proceed
```

**Email Already Exists:**
```
Email: existing@example.com
Expected: Error on submission
```

**Missing Required Field:**
```
(Any required field empty)
Expected: Cannot proceed to next step
```

## Expected Behavior Summary

### Step 1 → Step 2 Transition
- Animation: 400ms slide left-to-right
- Step 1 data: Preserved in form
- Validation: All Step 1 required fields must be valid
- Button state: "Next Step" disabled until valid

### Step 2 → Submission
- Validation: Only Terms acceptance required
- Optional fields: Can be empty
- Animation: Loading state on submit button
- Success: Modal appears, form resets to Step 1

### Back Navigation
- Animation: 400ms slide right-to-left
- Data preservation: All fields retain values
- No validation: Can go back anytime

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Performance Checks

- [ ] Animations run at 60fps
- [ ] No layout shifts during transitions
- [ ] Form interactions feel instant
- [ ] No console errors
- [ ] No memory leaks on repeated navigation

## Known Issues / Limitations

Document any issues found during testing:

1. Issue: _________________________________
   Impact: _________________________________
   Workaround: _________________________________

2. Issue: _________________________________
   Impact: _________________________________
   Workaround: _________________________________

## Sign-off

- [ ] All critical tests passed
- [ ] Responsive design verified
- [ ] Accessibility requirements met
- [ ] No blocking bugs found
- [ ] Ready for production

**Tested by:** __________________
**Date:** __________________
**Browser/Device:** __________________

