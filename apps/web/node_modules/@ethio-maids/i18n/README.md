# @ethio-maids/i18n - Internationalization Package

Translation management for Ethiopian Maids platform with English and Arabic support.

## Features

- ✅ English (en) and Arabic (ar) translations
- ✅ Automated string extraction from source code
- ✅ Translation completeness checking
- ✅ Nested key structure with dot notation
- ✅ Parameter interpolation with {{variable}} syntax
- ✅ RTL support for Arabic
- ✅ Fallback to English for missing translations

## Installation

```bash
pnpm install @ethio-maids/i18n
```

## Usage

### Basic Translation

```javascript
import { t } from '@ethio-maids/i18n';

// Simple translation
const greeting = t('en', 'common.buttons.save');
// => "Save"

// With parameters
const welcome = t('ar', 'dashboard.welcome', { name: 'Ahmed' });
// => "مرحبا، Ahmed!"

// Nested keys
const errorMsg = t('en', 'common.validation.required');
// => "This field is required"
```

### Check RTL

```javascript
import { isRTL, getDirection } from '@ethio-maids/i18n';

isRTL('ar');  // true
isRTL('en');  // false

getDirection('ar');  // 'rtl'
getDirection('en');  // 'ltr'
```

### React Integration

```jsx
import { t } from '@ethio-maids/i18n';
import { useState } from 'react';

function MyComponent() {
  const [locale, setLocale] = useState('en');

  return (
    <div dir={getDirection(locale)}>
      <h1>{t(locale, 'identity.register.title')}</h1>
      <button onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
        {t(locale, 'common.buttons.save')}
      </button>
    </div>
  );
}
```

## Translation Files

### Structure

```
packages/i18n/
├── locales/
│   ├── en.json          # English translations (source)
│   ├── ar.json          # Arabic translations
│   ├── extracted.json   # Auto-extracted strings
│   └── extraction-report.json  # Detailed extraction report
├── scripts/
│   ├── extract-strings.js       # String extraction tool
│   └── check-completeness.js    # Translation checker
├── index.js             # Main module
└── README.md
```

### Translation Keys

Translations use nested structure with dot notation:

```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel"
    },
    "validation": {
      "required": "This field is required"
    }
  },
  "identity": {
    "register": {
      "title": "Create Account",
      "emailPlaceholder": "Enter your email"
    }
  }
}
```

## Scripts

### Extract Strings

Automatically extract hard-coded English strings from source code:

```bash
# Extract strings to extracted.json
cd packages/i18n
node scripts/extract-strings.js

# Options
node scripts/extract-strings.js --dry-run    # Preview without writing
node scripts/extract-strings.js --merge      # Merge into en.json
node scripts/extract-strings.js --verbose    # Detailed output
node scripts/extract-strings.js --help       # Show all options
```

**What it extracts:**
- JSX text content: `<div>Text here</div>`
- String props: `placeholder="Text"`, `title="Text"`
- Button/Link text: `<button>Click Here</button>`
- Messages: `alert("Message")`, `toast("Message")`
- Validation messages: `message: "Error text"`

**Example output:**

```
🔍 Ethiopian Maids i18n String Extractor

Source directory: /path/to/src
Output file: /path/to/locales/extracted.json
Mode: WRITE

Scanning files...

📊 Extraction Statistics:
  Files scanned: 499
  Total strings found: 4812
  Unique strings: 2899

  By category:
    jsx_text_content: 2145
    string_props: 532
    messages: 102
    validation: 117

✅ Extracted strings written to: locales/extracted.json
📋 Detailed report: locales/extraction-report.json
```

### Check Translation Completeness

Verify all English keys have Arabic translations:

```bash
cd packages/i18n
node scripts/check-completeness.js
```

**Example output:**

```
🌍 Translation Completeness Check

Checking: ar.json against en.json

✅ All keys are translated!

📊 Statistics:
  Total keys: 224
  Translated: 224 (100%)
  Missing: 0 (0%)
```

## Workflow

### 1. Add New Features

When adding new UI text:

```jsx
// ❌ Bad: Hard-coded string
<button>Save Changes</button>

// ✅ Good: Use translation
<button>{t(locale, 'common.buttons.save')}</button>
```

### 2. Extract Strings

Run extraction to find hard-coded strings:

```bash
node scripts/extract-strings.js --dry-run
```

Review `extracted.json` and organize strings into proper categories.

### 3. Update Translations

**Add to English (en.json):**

```json
{
  "common": {
    "buttons": {
      "save": "Save Changes"
    }
  }
}
```

**Translate to Arabic (ar.json):**

```json
{
  "common": {
    "buttons": {
      "save": "حفظ التغييرات"
    }
  }
}
```

### 4. Check Completeness

Verify all keys are translated:

```bash
node scripts/check-completeness.js
```

### 5. Replace Hard-Coded Strings

Update your components to use `t()`:

```jsx
import { t } from '@ethio-maids/i18n';

function MyComponent({ locale }) {
  return (
    <div>
      <h1>{t(locale, 'common.buttons.save')}</h1>
    </div>
  );
}
```

## Current Translation Coverage

### Categories

1. **common** - Shared UI elements
   - buttons, labels, messages, validation, navigation

2. **identity** - Authentication
   - register, login, verification

3. **profiles** - User profiles
   - maid, sponsor

4. **jobs** - Job postings
   - create, search, filters, fields

5. **subscriptions** - Payment plans
   - plans, billing, features

6. **dashboard** - User dashboards
   - overview, stats, activity

## Extraction Report

After running extraction, check `locales/extraction-report.json` for:

- All extracted strings with file locations
- Occurrence count per string
- Line numbers for each occurrence
- Category breakdown

Example:

```json
{
  "timestamp": "2025-01-21T00:38:31.144Z",
  "stats": {
    "filesScanned": 499,
    "stringsFound": 4812,
    "uniqueStrings": 2899
  },
  "strings": [
    {
      "text": "Save Changes",
      "category": "Button/Link Text",
      "count": 5,
      "occurrences": [
        { "file": "src/components/Profile.jsx", "line": 42 },
        { "file": "src/components/Settings.jsx", "line": 88 }
      ]
    }
  ]
}
```

## Best Practices

### 1. Use Semantic Keys

```javascript
// ❌ Bad: Generic key
t(locale, 'text1')

// ✅ Good: Descriptive key
t(locale, 'profile.form.firstName')
```

### 2. Group Related Keys

```json
{
  "profile": {
    "form": {
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email Address"
    }
  }
}
```

### 3. Use Parameters for Dynamic Content

```javascript
// ❌ Bad: String concatenation
const msg = "Hello, " + userName + "!";

// ✅ Good: Parameter interpolation
const msg = t(locale, 'welcome.greeting', { name: userName });
// en.json: "welcome.greeting": "Hello, {{name}}!"
// ar.json: "welcome.greeting": "مرحبا، {{name}}!"
```

### 4. Handle Plurals

For plural forms, create separate keys:

```json
{
  "notifications": {
    "one": "You have 1 new message",
    "other": "You have {{count}} new messages"
  }
}
```

### 5. Keep Translations Short

Long text should be split into paragraphs:

```json
{
  "terms": {
    "paragraph1": "First paragraph...",
    "paragraph2": "Second paragraph...",
    "paragraph3": "Third paragraph..."
  }
}
```

## RTL Support

For Arabic (RTL) layout:

```jsx
import { getDirection } from '@ethio-maids/i18n';

function App({ locale }) {
  return (
    <div dir={getDirection(locale)} className="app">
      {/* Content automatically flows RTL for Arabic */}
    </div>
  );
}
```

## Contributing

### Adding New Language

1. Create new locale file: `locales/fr.json`
2. Add to `supportedLocales` in `index.js`
3. Add locale metadata with RTL flag
4. Translate all keys from `en.json`

### Translation Guidelines

- Keep translations culturally appropriate
- Maintain consistent terminology
- Test RTL layout for Arabic
- Verify parameter interpolation works
- Check for text overflow in UI

## Troubleshooting

### Missing Translation Warning

```
⚠️ Translation missing: profile.form.email (locale: ar)
```

**Solution:** Add the missing key to `ar.json`

### Parameter Not Interpolating

```javascript
// ❌ Wrong: Single braces
"greeting": "Hello, {name}!"

// ✅ Correct: Double braces
"greeting": "Hello, {{name}}!"
```

### Text Overflow in UI

For Arabic, text is typically 20-30% longer:

```css
/* Add responsive text sizing */
.translatable-text {
  overflow-wrap: break-word;
  hyphens: auto;
}
```

## License

MIT

## Support

For translation issues or questions:
- Check `extraction-report.json` for string locations
- Run `check-completeness.js` to find missing translations
- Review this README for best practices
