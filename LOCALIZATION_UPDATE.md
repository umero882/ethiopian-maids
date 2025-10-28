# Localization Update Summary

**Date**: October 21, 2025

## Changes Made

### Updated: `src/contexts/LocalizationContext.jsx`

**Removed unsupported UI locales:**
- ❌ `am` (Amharic)
- ❌ `tl` (Filipino)
- ❌ `id` (Indonesian)
- ❌ `si` (Sinhala)

**Remaining UI locales:**
- ✅ `en` (English)
- ✅ `ar` (Arabic)

## Important Distinction

### UI Localization vs Content Translation

There are TWO separate localization systems in the application:

#### 1. UI Localization (LocalizationContext)
**Purpose**: Display the user interface in the user's preferred language

**Location**: `src/contexts/LocalizationContext.jsx`

**Supported Languages**: English and Arabic only

**Usage**:
```jsx
import { useLocalization } from '@/contexts/LocalizationContext';

function MyComponent() {
  const { t, currentLocale } = useLocalization();

  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <button>{t('common.buttons.save')}</button>
    </div>
  );
}
```

**Translation Files**: `packages/i18n/locales/`
- `en.json` - English UI text
- `ar.json` - Arabic UI text

#### 2. AI Content Translation (AITranslationService)
**Purpose**: Translate user-generated content (messages, profiles, job postings) between multiple languages

**Location**: `src/services/aiTranslationService.js`

**Supported Languages**:
- English, Arabic, Amharic, French, Spanish
- Hindi, Urdu, Bengali, Tamil, Malayalam, Telugu, Kannada
- Sinhala, Thai, Vietnamese, Indonesian, Malay, Filipino

**Usage**:
```javascript
import aiTranslationService from '@/services/aiTranslationService';

// Translate a message from Filipino to Arabic
const translated = await aiTranslationService.translateText(
  'Kumusta po kayo',
  'tl',  // Filipino
  'ar'   // Arabic
);
// Result: "كيف حالك"
```

**Why Multiple Languages?**
The platform connects workers and sponsors from different countries who speak different languages. A Filipino maid may need to communicate with an Arabic-speaking sponsor, so the AI translation service supports many languages for real-time communication.

## Files That Should NOT Be Changed

The following files contain language codes (`am`, `tl`, `id`, `si`) for **AI translation purposes**, not UI localization. These should remain unchanged:

1. **`src/services/aiTranslationService.js`**
   - AI-powered content translation
   - Supports 17+ languages for user communication

2. **`src/services/intelligentNotificationService.js`**
   - Sends notifications in user's native language
   - Uses AI translation for multi-language support

3. **Payment/Financial pages** (if they reference languages)
   - May use translation for international payment descriptions
   - Currency descriptions in multiple languages

## Migration Guide for Existing Code

### Before (6 locales):
```javascript
export const SUPPORTED_LOCALES = {
  en: { code: 'en', name: 'English', ... },
  ar: { code: 'ar', name: 'Arabic', ... },
  am: { code: 'am', name: 'Amharic', ... },
  tl: { code: 'tl', name: 'Filipino', ... },
  id: { code: 'id', name: 'Indonesian', ... },
  si: { code: 'si', name: 'Sinhala', ... },
};
```

### After (2 locales):
```javascript
export const SUPPORTED_LOCALES = {
  en: { code: 'en', name: 'English', ... },
  ar: { code: 'ar', name: 'Arabic', ... },
};
```

## Testing Checklist

- [x] Remove unsupported locales from LocalizationContext
- [ ] Verify language selector shows only English and Arabic
- [ ] Test switching between English and Arabic in UI
- [ ] Verify RTL layout works correctly for Arabic
- [ ] Confirm AI translation still supports all languages
- [ ] Test message translation between different languages
- [ ] Verify fallback to English for missing translations

## Impact Assessment

### ✅ No Impact
- **AI Translation Service**: Still supports 17+ languages
- **User Communication**: Multi-language chat and messaging unchanged
- **Profile Translation**: Job postings and profiles can still be translated
- **Notification Service**: Can still send notifications in user's language

### ⚠️ Changed
- **UI Language Options**: Users can only select English or Arabic for interface
- **Settings Page**: Language dropdown shows 2 options instead of 6
- **Browser Detection**: Will only detect 'en' or 'ar', fallback to 'en' for others

### 📝 Recommended Follow-up

1. **Update Language Selector UI**
   - Remove dropdown if only 2 options
   - Consider toggle switch instead (EN/AR)

2. **Update Documentation**
   - Clarify UI vs content translation
   - Update user guide about language options

3. **Translation Files**
   - Complete Arabic translations in `packages/i18n/locales/ar.json`
   - Remove any unused locale files from `src/locales/` if they exist

4. **User Migration**
   - Users with locale set to `am`, `tl`, `id`, or `si` will be switched to English
   - Add notice explaining UI language is English or Arabic
   - Note that message translation still supports their language

## Code Examples

### Language Selector Component

**Before**:
```jsx
<select value={currentLocale} onChange={handleChange}>
  <option value="en">English</option>
  <option value="ar">العربية</option>
  <option value="am">አማርኛ</option>
  <option value="tl">Filipino</option>
  <option value="id">Bahasa Indonesia</option>
  <option value="si">සිංහල</option>
</select>
```

**After**:
```jsx
<div className="language-toggle">
  <button
    onClick={() => changeLocale('en')}
    className={currentLocale === 'en' ? 'active' : ''}
  >
    English
  </button>
  <button
    onClick={() => changeLocale('ar')}
    className={currentLocale === 'ar' ? 'active' : ''}
  >
    العربية
  </button>
</div>
```

### Using AI Translation

```jsx
// UI in user's language (English or Arabic)
const { t } = useLocalization();

// Content in sender's native language
import aiTranslationService from '@/services/aiTranslationService';

function MessageComponent({ message, senderLang, viewerLang }) {
  const [translatedText, setTranslatedText] = useState('');

  useEffect(() => {
    if (senderLang !== viewerLang) {
      aiTranslationService
        .translateText(message.text, senderLang, viewerLang)
        .then(setTranslatedText);
    }
  }, [message, senderLang, viewerLang]);

  return (
    <div>
      {/* UI labels in user's UI language */}
      <span className="label">{t('chat.from')}</span>

      {/* Message content translated to viewer's language */}
      <p>{translatedText || message.text}</p>

      {/* Show original if translated */}
      {translatedText && (
        <details>
          <summary>{t('chat.showOriginal')}</summary>
          <p className="original">{message.text}</p>
        </details>
      )}
    </div>
  );
}
```

## Summary

✅ **UI Localization**: Now supports only English and Arabic
- Cleaner, more maintainable
- Focused on languages with full translation support
- Matches business requirements (GCC region + Ethiopia)

✅ **AI Content Translation**: Still supports 17+ languages
- Enables communication across language barriers
- Workers and sponsors can use their native languages
- Real-time translation of messages and profiles

This update **simplifies the UI** while **maintaining rich translation capabilities** for user communication.

## Next Steps

1. ✅ Update `LocalizationContext.jsx` - **COMPLETE**
2. ⏳ Test language switching
3. ⏳ Complete Arabic translations in i18n package
4. ⏳ Update language selector components
5. ⏳ Add user migration notices
6. ⏳ Update documentation

## References

- **i18n Package**: `packages/i18n/` - UI translations
- **AI Translation**: `src/services/aiTranslationService.js` - Content translation
- **Context**: `src/contexts/LocalizationContext.jsx` - UI language management
- **Extraction Tool**: `packages/i18n/scripts/extract-strings.js` - Find translatable strings
