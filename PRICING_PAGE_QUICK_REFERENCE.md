# Pricing Page - Quick Reference Guide

## 🎯 What Changed

Your pricing page now automatically converts AED prices to the user's local currency based on their country.

---

## 📍 Key Features

### 1. **Automatic Currency Detection**
- Detects user's country from their IP address
- Maps country to local currency
- Example: US user sees USD, Ethiopian user sees ETB

### 2. **Live Exchange Rates**
- Fetches real exchange rates every hour
- Converts AED (Stripe base) to user's currency
- Falls back to manual rates if API fails

### 3. **Visual Indicators**
- Green badge at top: "United States • USD"
- Small indicator on each card: "Prices shown in USD (from AED)"
- Globe icon shows conversion is active

---

## 💰 Actual Stripe Prices (in AED)

All prices in Stripe Dashboard are in **AED** (UAE Dirham):

### Maid Plans:
- **Pro Monthly:** AED 75 (~$20 USD)
- **Pro Annual:** AED 750 (~$204 USD)
- **Premium Monthly:** AED 150 (~$40 USD)
- **Premium Annual:** AED 1,500 (~$408 USD)

### Sponsor Plans:
- **Pro Monthly:** AED 185 (~$50 USD)
- **Pro Annual:** AED 1,850 (~$504 USD)
- **Premium Monthly:** AED 370 (~$100 USD)
- **Premium Annual:** AED 3,700 (~$1,008 USD)

### Agency Plans:
- **Pro Monthly:** AED 295 (~$80 USD)
- **Pro Annual:** AED 2,950 (~$803 USD)
- **Premium Monthly:** AED 550 (~$150 USD)
- **Premium Annual:** AED 5,500 (~$1,498 USD)

**Exchange Rate:** 1 AED ≈ 0.27 USD

---

## 🌍 Supported Countries & Currencies

**25+ countries supported:**

| Region | Countries | Currencies |
|--------|-----------|------------|
| **Middle East** | UAE, Saudi Arabia, Kuwait, Qatar, Oman, Bahrain | AED, SAR, KWD, QAR, OMR, BHD |
| **Africa** | Ethiopia, Egypt, Kenya, Nigeria, South Africa | ETB, EGP, KES, NGN, ZAR |
| **Europe** | UK, Germany, France, Italy, Spain | GBP, EUR |
| **Americas** | USA, Canada | USD, CAD |
| **Asia** | India, China, Japan, Singapore | INR, CNY, JPY, SGD |

**Default:** If country not detected → UAE (AED)

---

## 🧪 How to Test

### Test 1: View Your Local Pricing
```
1. Open: http://localhost:5174/pricing
2. Check the green badge at top (shows your country + currency)
3. Verify prices are in your local currency
4. Look for "Prices shown in [CURRENCY] (from AED)" on cards
```

### Test 2: Manually Change Currency
```javascript
// Open browser console (F12), paste this:
localStorage.setItem('userCurrency', JSON.stringify({
  currency: 'USD',
  countryCode: 'US',
  countryName: 'United States'
}));

// Refresh page to see USD prices
```

### Test 3: Try Different Currencies
```javascript
// Ethiopian Birr (ETB)
localStorage.setItem('userCurrency', JSON.stringify({
  currency: 'ETB',
  countryCode: 'ET',
  countryName: 'Ethiopia'
}));

// Euro (EUR)
localStorage.setItem('userCurrency', JSON.stringify({
  currency: 'EUR',
  countryCode: 'DE',
  countryName: 'Germany'
}));

// British Pound (GBP)
localStorage.setItem('userCurrency', JSON.stringify({
  currency: 'GBP',
  countryCode: 'GB',
  countryName: 'United Kingdom'
}));

// Refresh page each time
```

### Test 4: Reset to Auto-Detect
```javascript
// Remove saved preference
localStorage.removeItem('userCurrency');
// Refresh page - will auto-detect from IP again
```

---

## 🔧 Technical Details

### Files Involved:
1. **`src/services/currencyService.js`** - Currency detection & conversion logic
2. **`src/hooks/useCurrency.js`** - React hook for components
3. **`src/config/stripeConfig.js`** - Stripe prices (now in AED)
4. **`src/pages/PricingPage.jsx`** - Updated to use currency conversion

### APIs Used:
- **IP Geolocation:** https://ipapi.co/ (free, 1000/day)
- **Exchange Rates:** https://exchangerate-api.com/ (free, 1500/month)

### How It Works:
```
User visits pricing page
  ↓
Detect country from IP (ipapi.co)
  ↓
Map country to currency (e.g., US → USD)
  ↓
Fetch exchange rates (exchangerate-api.com)
  ↓
Convert AED prices to user's currency
  ↓
Display formatted prices
```

---

## 📊 Example Conversions

**Original Stripe Price:** Sponsor Pro Monthly = AED 185

| User's Country | Currency | Converted Price | Exchange Rate |
|----------------|----------|-----------------|---------------|
| **UAE** | AED | AED 185.00 | 1.00 |
| **USA** | USD | $50.00 | 0.27 |
| **Ethiopia** | ETB | ETB 2,830.50 | 15.30 |
| **UK** | GBP | £38.85 | 0.21 |
| **EU** | EUR | €46.25 | 0.25 |
| **Saudi Arabia** | SAR | SAR 188.70 | 1.02 |

---

## ⚙️ Configuration

### Update Exchange Rates:
Edit `src/services/currencyService.js`:

```javascript
const getFallbackRates = () => {
  return {
    AED: 1.0,
    USD: 0.27,  // Update this
    EUR: 0.25,  // Update this
    GBP: 0.21,  // Update this
    ETB: 15.30, // Update this
    // ... add more
  };
};
```

### Add New Currency:
1. Add to country mapping in `currencyService.js`:
```javascript
const COUNTRY_CURRENCY_MAP = {
  // ... existing
  PH: 'PHP', // Philippines
  MY: 'MYR', // Malaysia
};
```

2. Add fallback rate:
```javascript
const getFallbackRates = () => {
  return {
    // ... existing
    PHP: 15.20, // 1 AED = 15.20 PHP
    MYR: 1.24,  // 1 AED = 1.24 MYR
  };
};
```

---

## 🚨 Troubleshooting

### Prices Not Showing?
```javascript
// Check console for errors
// Browser Console (F12) → Console tab

// Check if currency service is working
console.log(localStorage.getItem('userCurrency'));

// Force refresh
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Wrong Currency Detected?
```javascript
// Clear saved currency
localStorage.removeItem('userCurrency');
// Refresh page
location.reload();
```

### Prices Still in AED?
This is normal if:
- You're in UAE
- API couldn't detect your country (defaults to UAE)
- VPN is off and you're actually in UAE

To test with different currency:
```javascript
// Force USD
localStorage.setItem('userCurrency', JSON.stringify({
  currency: 'USD',
  countryCode: 'US',
  countryName: 'United States'
}));
location.reload();
```

---

## ✅ What to Check Before Launch

### Pre-Launch Checklist:

- [ ] Pricing page loads without errors
- [ ] Currency badge shows correct country
- [ ] Prices convert correctly (spot check with calculator)
- [ ] Annual pricing shows correct monthly equivalent
- [ ] "Billed annually" shows correct total
- [ ] Mobile responsive (check on phone)
- [ ] Loading states appear while converting
- [ ] Stripe checkout uses correct Price IDs (test purchase)
- [ ] Conversion indicator shows on non-AED currencies

### Stripe Dashboard Check:

1. Log in to Stripe Dashboard
2. Go to Products → Prices
3. Verify all prices are in **AED**
4. Match Price IDs with `.env` file

---

## 🎨 UI Examples

### What Users See:

**Badge at Top:**
```
🌍 United States • USD
```

**Price Card:**
```
$50.00 /month
Billed annually ($600.00)
🌍 Prices shown in USD (from AED)
```

**For UAE Users (AED):**
```
AED 185.00 /month
Billed annually (AED 1,850.00)
(No conversion indicator - base currency)
```

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12 → Console)
2. Review `CURRENCY_CONVERSION_IMPLEMENTATION.md` for details
3. Test APIs manually:
   ```bash
   curl https://ipapi.co/json/
   curl https://api.exchangerate-api.com/v4/latest/AED
   ```

---

## 🎯 Quick Commands

```bash
# Start dev server
npm run dev

# Open pricing page
# Browser: http://localhost:5174/pricing

# Check for errors
# Browser: F12 → Console tab

# Reset currency detection
# Browser Console:
localStorage.removeItem('userCurrency');
location.reload();
```

---

**Status:** ✅ Ready to test!
**Testing URL:** http://localhost:5174/pricing
**Implementation Date:** 2025-10-16
