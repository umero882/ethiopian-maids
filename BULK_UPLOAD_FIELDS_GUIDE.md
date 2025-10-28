# Bulk Maid Upload - Complete Field Guide

**Last Updated:** October 24, 2025
**Status:** ✅ All fields supported

---

## Overview

The bulk upload feature now supports **ALL possible fields** from the maid_profiles database table. This guide provides comprehensive documentation for agencies uploading multiple maid profiles.

---

## Required Fields

These fields **must** be provided for each maid:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `fullName` | String | Full legal name | "Alem Bekele" |
| `dateOfBirth` | Date | Birth date (ISO format or valid date string) | "1995-06-15" |

**Validation:**
- Age must be between 18 and 65 years
- Full name cannot be empty

---

## Personal Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `nationality` | String | No | ISO country code | "ET" (default) |
| `currentLocation` | String | No | Current city/country | "Addis Ababa, Ethiopia" |
| `maritalStatus` | String | No | Marital status | "single", "married", "divorced", "widowed" |
| `childrenCount` | Integer | No | Number of children | 2 |

---

## Contact Information

| Field | Type | Required | Description | Example | Validation |
|-------|------|----------|-------------|---------|------------|
| `phone` | String | No | Phone number with country code | "+251911234567" | Valid phone format |
| `email` | String | No | Email address | "alem.bekele@email.com" | Valid email format |
| `profilePhoto` | String | No | URL to profile photo | "https://..." | Valid URL |

---

## Professional Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `experienceYears` | Integer | No | Total years of experience | 5 |
| `previousCountries` | Array | No | Countries worked in before | ["SA", "AE", "KW"] |
| `skills` | Array | No | List of skills | ["cooking", "childcare", "cleaning", "elderly care"] |
| `languages` | Array | No | Languages spoken | ["am", "en", "ar"] |
| `educationLevel` | String | No | Highest education level | "high school", "diploma", "degree" |

**Validation:**
- `experienceYears`: Must be between 0 and 50
- `skills`: If provided, must contain at least one skill
- `languages`: If provided, must contain at least one language

---

## Work Experience (Detailed)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `workExperience` | Array | No | Detailed work history | See below |

**Work Experience Object Structure:**
```json
{
  "employer": "Al-Mansour Family",
  "country": "SA",
  "position": "Domestic Helper",
  "startDate": "2018-01-01",
  "endDate": "2020-12-31",
  "duties": ["Childcare", "Cooking", "Cleaning"],
  "reference": {
    "name": "Mrs. Al-Mansour",
    "phone": "+966501234567"
  }
}
```

---

## Work Preferences

| Field | Type | Required | Description | Example | Validation |
|-------|------|----------|-------------|---------|------------|
| `preferredSalaryMin` | Integer | No | Minimum monthly salary | 1500 | Must be positive |
| `preferredSalaryMax` | Integer | No | Maximum monthly salary | 2500 | Must be ≥ min |
| `preferredCurrency` | String | No | Salary currency | "USD", "SAR", "AED" | ISO currency code |
| `availableFrom` | Date | No | Available start date | "2025-11-01" | Valid date |
| `contractDurationPreference` | String | No | Preferred contract length | "1-year", "2-years", "flexible" | - |
| `liveInPreference` | Boolean | No | Prefers live-in work | true | Default: true |
| `preferredCountries` | Array | No | Preferred destination countries | ["SA", "AE", "QA"] | ISO country codes |

---

## Documents & Verification

| Field | Type | Required | Description | Example | Validation |
|-------|------|----------|-------------|---------|------------|
| `passportNumber` | String | No | Passport number | "EP1234567" | - |
| `passportExpiry` | Date | No | Passport expiry date | "2028-12-31" | Must be future date |
| `visaStatus` | String | No | Current visa status | "Valid", "Expired", "In Process" | - |
| `medicalCertificateValid` | Boolean | No | Has valid medical cert | true | Default: false |
| `policeClearanceValid` | Boolean | No | Has valid police clearance | true | Default: false |

### Legacy Document Fields (Backward Compatibility)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `passport` | String | URL to passport scan | "https://..." |
| `medicalCertificate` | String | URL to medical cert | "https://..." |
| `policeClearance` | String | URL to police clearance | "https://..." |

---

## Profile Status

| Field | Type | Required | Description | Example | Validation |
|-------|------|----------|-------------|---------|------------|
| `availabilityStatus` | String | No | Current availability | "available", "busy", "hired", "inactive" | Valid status |
| `profileCompletionPercentage` | Integer | No | Profile completion % | 75 | 0-100 |
| `verificationStatus` | String | No | Verification status | "pending", "verified", "rejected" | Valid status |
| `status` | String | No | Profile status | "draft", "active", "archived" | Default: "draft" |

---

## Metadata (Optional)

These fields are typically system-managed but can be provided:

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `profileViews` | Integer | Number of profile views | 0 |
| `totalApplications` | Integer | Total job applications | 0 |
| `successfulPlacements` | Integer | Number of successful placements | 0 |
| `averageRating` | Decimal | Average rating (0.00-5.00) | 0.00 |
| `isVerified` | Boolean | Profile verified by admin | false |
| `verifiedAt` | Date | Verification timestamp | null |
| `agencyApproved` | Boolean | Approved by agency | true (auto-set) |

---

## Complete Example - Minimal

Minimum required data to upload a maid:

```json
{
  "fullName": "Alem Bekele",
  "dateOfBirth": "1995-06-15"
}
```

---

## Complete Example - Basic

Basic profile with common fields:

```json
{
  "fullName": "Alem Bekele",
  "dateOfBirth": "1995-06-15",
  "nationality": "ET",
  "phone": "+251911234567",
  "email": "alem.bekele@email.com",
  "skills": ["cooking", "childcare", "cleaning"],
  "languages": ["am", "en", "ar"],
  "experienceYears": 5,
  "preferredSalaryMin": 1500,
  "preferredSalaryMax": 2500,
  "preferredCurrency": "USD",
  "availabilityStatus": "available"
}
```

---

## Complete Example - Full Profile

Comprehensive profile with all fields:

```json
{
  "fullName": "Alem Bekele",
  "dateOfBirth": "1995-06-15",
  "nationality": "ET",
  "currentLocation": "Addis Ababa, Ethiopia",
  "maritalStatus": "single",
  "childrenCount": 0,

  "phone": "+251911234567",
  "email": "alem.bekele@email.com",
  "profilePhoto": "https://storage.example.com/photos/alem-bekele.jpg",

  "experienceYears": 5,
  "previousCountries": ["SA", "AE"],
  "skills": ["cooking", "childcare", "cleaning", "elderly care", "ironing"],
  "languages": ["am", "en", "ar"],
  "educationLevel": "high school",

  "workExperience": [
    {
      "employer": "Al-Mansour Family",
      "country": "SA",
      "city": "Riyadh",
      "position": "Domestic Helper",
      "startDate": "2018-01-01",
      "endDate": "2020-12-31",
      "duties": ["Childcare for 2 children", "Cooking", "Light cleaning"],
      "reason_for_leaving": "Contract completed",
      "reference": {
        "name": "Mrs. Al-Mansour",
        "phone": "+966501234567",
        "relationship": "Employer"
      }
    },
    {
      "employer": "Dubai Villa Services",
      "country": "AE",
      "city": "Dubai",
      "position": "Nanny",
      "startDate": "2021-02-01",
      "endDate": "2023-06-30",
      "duties": ["Full-time childcare", "Meal preparation", "Educational activities"],
      "reason_for_leaving": "Family relocated",
      "reference": {
        "name": "Mr. Ahmed Hassan",
        "phone": "+971501234567",
        "relationship": "Employer"
      }
    }
  ],

  "preferredSalaryMin": 1800,
  "preferredSalaryMax": 2500,
  "preferredCurrency": "USD",
  "availableFrom": "2025-11-01",
  "contractDurationPreference": "2-years",
  "liveInPreference": true,
  "preferredCountries": ["SA", "AE", "QA", "KW"],

  "passportNumber": "EP1234567",
  "passportExpiry": "2028-12-31",
  "visaStatus": "Ready to process",
  "medicalCertificateValid": true,
  "policeClearanceValid": true,

  "availabilityStatus": "available",
  "verificationStatus": "verified",
  "profileCompletionPercentage": 95,
  "isVerified": true,

  "profileViews": 0,
  "totalApplications": 0,
  "successfulPlacements": 2,
  "averageRating": 4.8
}
```

---

## Bulk Upload Array Example

Upload multiple maids at once:

```json
{
  "agencyId": "uuid-here",
  "userId": "user-uuid-here",
  "validateOnly": false,
  "maidsData": [
    {
      "fullName": "Alem Bekele",
      "dateOfBirth": "1995-06-15",
      "phone": "+251911234567",
      "skills": ["cooking", "childcare"],
      "languages": ["am", "en", "ar"]
    },
    {
      "fullName": "Tigist Worku",
      "dateOfBirth": "1992-03-20",
      "phone": "+251922345678",
      "skills": ["elderly care", "cooking"],
      "languages": ["am", "en"]
    },
    {
      "fullName": "Meseret Tadesse",
      "dateOfBirth": "1998-11-10",
      "phone": "+251933456789",
      "skills": ["childcare", "cleaning"],
      "languages": ["am", "ar"]
    }
  ]
}
```

---

## Validation Rules Summary

### Age Validation
- ✅ Minimum age: 18 years
- ✅ Maximum age: 65 years

### Phone Validation
- ✅ Must match pattern: `^[+]?[\d\s-()]+$`
- ✅ Example valid: "+251911234567", "0911-234-567"

### Email Validation
- ✅ Must match pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- ✅ Example valid: "name@example.com"

### Marital Status
- ✅ Allowed: "single", "married", "divorced", "widowed"

### Experience Years
- ✅ Range: 0 to 50 years

### Children Count
- ✅ Range: 0 to 20

### Salary
- ✅ Must be positive numbers
- ✅ Max must be ≥ Min

### Passport Expiry
- ✅ Must be a future date (not expired)

### Availability Status
- ✅ Allowed: "available", "busy", "hired", "inactive"

### Verification Status
- ✅ Allowed: "pending", "verified", "rejected"

---

## API Usage

### Validate Only Mode

Test your data without creating profiles:

```javascript
const result = await bulkUploadMaidsUseCase.execute({
  agencyId: "agency-uuid",
  userId: "user-uuid",
  validateOnly: true,  // Only validate, don't create
  maidsData: [
    { fullName: "Test", dateOfBirth: "1995-01-01" }
  ]
});

console.log(result.summary);
// { total: 1, succeeded: 1, failed: 0, validateOnly: true }
```

### Create Mode

Create profiles after validation:

```javascript
const result = await bulkUploadMaidsUseCase.execute({
  agencyId: "agency-uuid",
  userId: "user-uuid",
  validateOnly: false,  // Create profiles
  maidsData: [/* ... */]
});

console.log(result.successful);
// [{ rowNumber: 1, maidId: "uuid", fullName: "...", status: "created" }]

console.log(result.failed);
// [{ rowNumber: 2, data: {...}, error: "...", status: "failed" }]
```

---

## Response Format

### Success Response

```json
{
  "successful": [
    {
      "rowNumber": 1,
      "maidId": "uuid-generated",
      "fullName": "Alem Bekele",
      "status": "created"
    },
    {
      "rowNumber": 3,
      "maidId": "uuid-generated",
      "fullName": "Meseret Tadesse",
      "status": "created"
    }
  ],
  "failed": [
    {
      "rowNumber": 2,
      "data": { "fullName": "Invalid", "dateOfBirth": "not-a-date" },
      "error": "Row 2 validation errors: Invalid date of birth format",
      "status": "failed"
    }
  ],
  "summary": {
    "total": 3,
    "succeeded": 2,
    "failed": 1,
    "validateOnly": false
  }
}
```

---

## Best Practices

### 1. Data Preparation
- ✅ Always validate data before bulk upload
- ✅ Use `validateOnly: true` first to catch errors
- ✅ Fix all validation errors before creating profiles

### 2. Batch Size
- ✅ Maximum: 100 profiles per batch
- ✅ Recommended: 20-50 profiles per batch for better error handling
- ✅ Split large datasets into multiple batches

### 3. Error Handling
- ✅ Review all failed rows in the response
- ✅ Fix errors and retry failed rows separately
- ✅ Don't retry successful rows (check `maidId` in response)

### 4. Data Quality
- ✅ Provide as many fields as possible for better matching
- ✅ Always include skills and languages
- ✅ Include work experience for experienced maids
- ✅ Verify passport expiry dates

### 5. Performance
- ✅ Upload during off-peak hours for large batches
- ✅ Monitor response times and adjust batch size
- ✅ Use parallel uploads for multiple independent batches

---

## Common Errors and Solutions

### Error: "Age must be at least 18 years old"
**Solution:** Check dateOfBirth format and calculate age correctly

### Error: "Invalid phone number format"
**Solution:** Use international format: +[country code][number]

### Error: "Maximum salary cannot be less than minimum salary"
**Solution:** Ensure preferredSalaryMax ≥ preferredSalaryMin

### Error: "Passport has expired"
**Solution:** Update passportExpiry to a future date

### Error: "Skills must be an array"
**Solution:** Wrap skills in array: `["cooking", "childcare"]` not `"cooking"`

### Error: "Batch size exceeds maximum of 100 profiles"
**Solution:** Split your data into smaller batches

---

## Integration with Frontend

### Using the Hook

```javascript
import { useAgencyMaids } from '@/hooks/useAgencyMaids';

const BulkUploadPage = () => {
  const { bulkUploadMaids } = useAgencyMaids();

  const handleUpload = async (fileData) => {
    // Parse CSV/Excel to JSON
    const maidsData = parseFileToJSON(fileData);

    // Validate first
    const validation = await bulkUploadMaids(maidsData, true);

    if (validation.summary.failed > 0) {
      showErrors(validation.failed);
      return;
    }

    // Then create
    const result = await bulkUploadMaids(maidsData, false);

    showSuccess(`Created ${result.summary.succeeded} profiles`);

    if (result.summary.failed > 0) {
      showPartialErrors(result.failed);
    }
  };
};
```

---

## CSV Template

For Excel/CSV uploads, use this header row:

```csv
fullName,dateOfBirth,nationality,phone,email,skills,languages,experienceYears,preferredSalaryMin,preferredSalaryMax,preferredCurrency,currentLocation,maritalStatus,childrenCount,educationLevel,availabilityStatus
Alem Bekele,1995-06-15,ET,+251911234567,alem@email.com,"cooking,childcare,cleaning","am,en,ar",5,1500,2500,USD,Addis Ababa,single,0,high school,available
Tigist Worku,1992-03-20,ET,+251922345678,tigist@email.com,"elderly care,cooking","am,en",8,1800,2800,USD,Bahir Dar,married,2,diploma,available
```

**Note:** Arrays (skills, languages) should be comma-separated in the CSV cell.

---

## Summary

✅ **All 40+ fields supported**
✅ **Comprehensive validation**
✅ **Flexible - only 2 fields required**
✅ **Batch processing up to 100 profiles**
✅ **Partial success handling**
✅ **Audit logging for all operations**

**Ready for production use!** 🚀

---

**For support or questions, contact your development team.**
