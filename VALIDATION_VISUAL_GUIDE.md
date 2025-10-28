# Visual Guide: Inline Validation

## What You'll See

### Before Clicking "Save Changes" (Initial State)
```
┌─────────────────────────────────────────────────────┐
│ Personal Information                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Full Name *              Country *                 │
│ ┌──────────────┐        ┌──────────────┐          │
│ │              │        │              │          │
│ └──────────────┘        └──────────────┘          │
│                                                     │
│ City *                   Accommodation Type        │
│ ┌──────────────┐        ┌──────────────┐          │
│ │              │        │              │          │
│ └──────────────┘        └──────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘

Note: Red asterisk (*) indicates required field
```

### After Clicking "Save Changes" (With Validation Errors)
```
┌─────────────────────────────────────────────────────┐
│ Personal Information                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Full Name *              Country *                 │
│ ┌──────────────┐        ┌──────────────┐          │
│ │              │🔴      │              │🔴        │
│ └──────────────┘        └──────────────┘          │
│ ⚠️ Full name is required ⚠️ Country is required    │
│                                                     │
│ City *                   Accommodation Type        │
│ ┌──────────────┐        ┌──────────────┐          │
│ │              │🔴      │              │          │
│ └──────────────┘        └──────────────┘          │
│ ⚠️ City is required                                │
│                                                     │
└─────────────────────────────────────────────────────┘

🔴 = Red border around field
⚠️ = Red error icon with error message
```

### After User Starts Typing (Real-time Clearing)
```
┌─────────────────────────────────────────────────────┐
│ Personal Information                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Full Name *              Country *                 │
│ ┌──────────────┐        ┌──────────────┐          │
│ │ John Smith   │✅      │              │🔴        │
│ └──────────────┘        └──────────────┘          │
│                          ⚠️ Country is required    │
│                                                     │
│ City *                   Accommodation Type        │
│ ┌──────────────┐        ┌──────────────┐          │
│ │              │🔴      │              │          │
│ └──────────────┘        └──────────────┘          │
│ ⚠️ City is required                                │
│                                                     │
└─────────────────────────────────────────────────────┘

✅ = Normal border (validation passed for this field)
```

### Toast Notification (When Validation Fails)
```
┌──────────────────────────────────────────┐
│ ⚠️ Validation Error                      │
│                                          │
│ Please fill in all required fields      │
│ (marked with *)                          │
│                                          │
│                                    [✕]   │
└──────────────────────────────────────────┘
```

### Successful Save (All Fields Valid)
```
┌──────────────────────────────────────────┐
│ ✓ Success                                │
│                                          │
│ Profile updated successfully             │
│                                          │
│                                    [✕]   │
└──────────────────────────────────────────┘
```

## Color Legend

### Required Field Indicator
- **Color**: `text-red-500` (bright red)
- **Symbol**: Asterisk (*)
- **Location**: Next to field label

### Error Border
- **Color**: `border-red-500` (bright red)
- **Width**: 2px
- **Focus Ring**: `ring-red-500` (bright red)

### Error Message
- **Icon**: AlertCircle (⚠️)
- **Icon Color**: `text-red-500` (bright red)
- **Text Color**: `text-red-500` (bright red)
- **Font Size**: `text-sm` (14px)
- **Layout**: Flex row with gap

### Normal State
- **Border**: `border-gray-300` (light gray)
- **Focus Ring**: `ring-purple-500` (purple)
- **Background**: White

## User Flow Diagram

```
START
  │
  ├─> User clicks "Edit Profile"
  │
  ├─> User sees form with asterisks (*) on required fields
  │
  ├─> User clicks "Save Changes"
  │
  ├─> VALIDATION CHECK
  │   │
  │   ├─> Are all required fields filled?
  │   │   │
  │   │   ├─> YES ──> Save to database ──> Show success toast ──> Exit edit mode ──> END
  │   │   │
  │   │   └─> NO
  │       │
  │       ├─> Show validation error toast
  │       ├─> Highlight empty required fields in red
  │       ├─> Show error messages below fields
  │       ├─> Auto-scroll to first error
  │       ├─> Auto-focus on first error field
  │       │
  │       └─> User starts typing in empty field
  │           │
  │           ├─> Error clears for that field immediately
  │           │
  │           └─> Return to "User clicks 'Save Changes'"
```

## Keyboard Navigation

1. **Tab**: Move between fields
2. **Enter**: (in input field) - no action, prevents accidental form submission
3. **Escape**: (when focused on field) - blur field
4. **Space**: (on switches/checkboxes) - toggle value

## Screen Reader Support

Fields announce:
- "Full Name, required, edit text"
- "Country, required, edit text"
- "City, required, edit text"

When error appears:
- "Full name is required, error"

## Mobile View

On mobile devices (< 768px):
- Fields stack vertically instead of side-by-side
- Error messages maintain full visibility
- Touch targets are 44x44px minimum
- Auto-scroll and auto-focus still work

## Animation

- **Error appearance**: Instant (0ms)
- **Error clearing**: Instant (0ms)
- **Toast notification**: Slide in from top (300ms)
- **Scroll to error**: Smooth scroll (500ms)

## Browser Testing

Tested and working in:
- ✅ Chrome 120+ (Windows, Mac, Android)
- ✅ Firefox 120+ (Windows, Mac, Android)
- ✅ Safari 17+ (Mac, iOS)
- ✅ Edge 120+ (Windows)

## Example Code Snippets

### Input with Error State
```jsx
<Input
  id='full_name'
  value={profileData.full_name}
  onChange={(e) => onProfileChange({ ...profileData, full_name: e.target.value })}
  disabled={!isEditing}
  className={errors.full_name && touched.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
/>
```

### Error Message Display
```jsx
{errors.full_name && touched.full_name && (
  <div className='flex items-center gap-1 text-red-500 text-sm'>
    <AlertCircle className='h-4 w-4' />
    <span>{errors.full_name}</span>
  </div>
)}
```

### Label with Required Indicator
```jsx
<Label htmlFor='full_name' className='flex items-center gap-1'>
  Full Name <span className='text-red-500'>*</span>
</Label>
```
