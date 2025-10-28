/**
 * 🛡️ Centralized Validation Schemas
 * Ethiopian Maids Platform - Input Validation
 */

// Validation utilities
const ValidationError = class extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
};

// Common validation patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+[1-9]\d{1,14}$/, // International format
  ethiopianPhone: /^\+251[0-9]{9}$/, // Ethiopian format
  gccPhone: /^\+(?:971|966|965|968|974|973|964)[0-9]{7,9}$/, // GCC countries
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s'-]{2,50}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

// Age validation for Ethiopian Maids (must be 18+)
const validateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 18;
};

// User Registration Validation
export const userRegistrationSchema = {
  validate: (data) => {
    const errors = {};

    // Email validation
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!PATTERNS.email.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!PATTERNS.password.test(data.password)) {
      errors.password =
        'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // User type validation
    const validUserTypes = ['maid', 'sponsor', 'agency'];
    if (!data.userType || !validUserTypes.includes(data.userType)) {
      errors.userType = 'Please select a valid user type';
    }

    // Name validation
    if (!data.name) {
      errors.name = 'Name is required';
    } else if (!PATTERNS.name.test(data.name)) {
      errors.name =
        'Name must contain only letters, spaces, hyphens, and apostrophes';
    }

    // Phone validation (optional but if provided must be valid)
    if (data.phone && !PATTERNS.phone.test(data.phone)) {
      errors.phone =
        'Please enter a valid international phone number (e.g., +251912345678)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// Maid Profile Validation
export const maidProfileSchema = {
  validate: (data) => {
    const errors = {};

    // Required fields
    const requiredFields = [
      'fullName',
      'dateOfBirth',
      'nationality',
      'currentLocation',
    ];
    requiredFields.forEach((field) => {
      if (!data[field]) {
        errors[field] =
          `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    });

    // Age validation (must be 18+)
    if (data.dateOfBirth && !validateAge(data.dateOfBirth)) {
      errors.dateOfBirth = 'Maid must be at least 18 years old';
    }

    // Experience validation
    if (
      data.experienceYears &&
      (data.experienceYears < 0 || data.experienceYears > 50)
    ) {
      errors.experienceYears = 'Experience must be between 0 and 50 years';
    }

    // Skills validation
    if (data.skills && data.skills.length === 0) {
      errors.skills = 'Please select at least one skill';
    }

    // Languages validation
    if (data.languages && data.languages.length === 0) {
      errors.languages = 'Please select at least one language';
    }

    // Salary expectations
    if (
      data.expectedSalary &&
      (data.expectedSalary < 100 || data.expectedSalary > 10000)
    ) {
      errors.expectedSalary =
        'Expected salary must be between $100 and $10,000';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// Comprehensive Sponsor Profile Validation
export const sponsorProfileSchema = {
  validate: (data) => {
    const errors = {};

    // Required fields
    if (!data.full_name?.trim()) errors.full_name = 'Full name is required';
    if (!data.country) errors.country = 'Country is required';
    if (!data.city?.trim()) errors.city = 'City is required';
    if (!data.accommodation_type)
      errors.accommodation_type = 'Accommodation type is required';
    if (!data.salary_budget_min)
      errors.salary_budget_min = 'Minimum budget is required';
    if (!data.salary_budget_max)
      errors.salary_budget_max = 'Maximum budget is required';

    // GCC country validation
    const gccCountries = [
      'UAE',
      'Saudi Arabia',
      'Kuwait',
      'Qatar',
      'Bahrain',
      'Oman',
    ];
    if (data.country && !gccCountries.includes(data.country)) {
      errors.country = 'Currently only serving GCC countries';
    }

    // Budget validation
    if (data.salary_budget_min && data.salary_budget_max) {
      const minBudget = parseInt(data.salary_budget_min);
      const maxBudget = parseInt(data.salary_budget_max);

      if (isNaN(minBudget) || minBudget < 0) {
        errors.salary_budget_min =
          'Minimum budget must be a valid positive number';
      }
      if (isNaN(maxBudget) || maxBudget < 0) {
        errors.salary_budget_max =
          'Maximum budget must be a valid positive number';
      }
      if (minBudget >= maxBudget) {
        errors.salary_budget_max =
          'Maximum budget must be higher than minimum budget';
      }
    }

    // Family size validation
    if (data.family_size && (data.family_size < 1 || data.family_size > 20)) {
      errors.family_size = 'Family size must be between 1 and 20';
    }

    // Children validation
    if (data.children_count && data.children_count < 0) {
      errors.children_count = 'Children count cannot be negative';
    }

    if (
      data.children_count > 0 &&
      (!data.children_ages || data.children_ages.length === 0)
    ) {
      errors.children_ages = 'Please specify children ages';
    }

    // Working hours validation
    if (
      data.working_hours_per_day &&
      (data.working_hours_per_day < 4 || data.working_hours_per_day > 12)
    ) {
      errors.working_hours_per_day =
        'Working hours must be between 4 and 12 hours per day';
    }

    // Days off validation
    if (
      data.days_off_per_week &&
      (data.days_off_per_week < 0 || data.days_off_per_week > 3)
    ) {
      errors.days_off_per_week =
        'Days off must be between 0 and 3 days per week';
    }

    // Experience years validation
    if (
      data.preferred_experience_years &&
      (data.preferred_experience_years < 0 ||
        data.preferred_experience_years > 20)
    ) {
      errors.preferred_experience_years =
        'Experience years must be between 0 and 20';
    }

    // Currency validation
    const validCurrencies = ['USD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'];
    if (data.currency && !validCurrencies.includes(data.currency)) {
      errors.currency = 'Please select a valid currency';
    }

    // Accommodation type validation
    const validAccommodationTypes = [
      'Separate Room',
      'Shared Room',
      'Live-out',
      'Studio Apartment',
    ];
    if (
      data.accommodation_type &&
      !validAccommodationTypes.includes(data.accommodation_type)
    ) {
      errors.accommodation_type = 'Please select a valid accommodation type';
    }

    // Array field validation
    if (
      data.preferred_nationality &&
      !Array.isArray(data.preferred_nationality)
    ) {
      errors.preferred_nationality = 'Preferred nationality must be an array';
    }
    if (data.required_skills && !Array.isArray(data.required_skills)) {
      errors.required_skills = 'Required skills must be an array';
    }
    if (data.preferred_languages && !Array.isArray(data.preferred_languages)) {
      errors.preferred_languages = 'Preferred languages must be an array';
    }
    if (data.children_ages && !Array.isArray(data.children_ages)) {
      errors.children_ages = 'Children ages must be an array';
    }
    if (data.pet_types && !Array.isArray(data.pet_types)) {
      errors.pet_types = 'Pet types must be an array';
    }
    if (data.additional_benefits && !Array.isArray(data.additional_benefits)) {
      errors.additional_benefits = 'Additional benefits must be an array';
    }

    // Family size validation
    if (data.familySize && (data.familySize < 1 || data.familySize > 20)) {
      errors.familySize = 'Family size must be between 1 and 20 members';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// Job Posting Validation
export const jobPostingSchema = {
  validate: (data) => {
    const errors = {};

    // Required fields
    if (!data.title) errors.title = 'Job title is required';
    if (!data.description) errors.description = 'Job description is required';
    if (!data.country) errors.country = 'Country is required';
    if (!data.city) errors.city = 'City is required';

    // Salary validation
    if (!data.salaryMin) {
      errors.salaryMin = 'Minimum salary is required';
    } else if (data.salaryMin < 100) {
      errors.salaryMin = 'Minimum salary must be at least $100';
    }

    if (data.salaryMax && data.salaryMax < data.salaryMin) {
      errors.salaryMax = 'Maximum salary must be greater than minimum salary';
    }

    // Required skills
    if (!data.requiredSkills || data.requiredSkills.length === 0) {
      errors.requiredSkills = 'Please select at least one required skill';
    }

    // Working hours validation
    if (
      data.workingHoursPerDay &&
      (data.workingHoursPerDay < 4 || data.workingHoursPerDay > 16)
    ) {
      errors.workingHoursPerDay =
        'Working hours must be between 4 and 16 hours per day';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// File Upload Validation
export const fileUploadSchema = {
  validate: (file, type = 'image') => {
    const errors = {};

    if (!file) {
      errors.file = 'File is required';
      return { isValid: false, errors };
    }

    // File size limits
    const maxSizes = {
      image: 5 * 1024 * 1024, // 5MB
      video: 50 * 1024 * 1024, // 50MB
      document: 10 * 1024 * 1024, // 10MB
    };

    if (file.size > maxSizes[type]) {
      errors.file = `File size must be less than ${maxSizes[type] / (1024 * 1024)}MB`;
    }

    // File type validation
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/webm'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    };

    if (!allowedTypes[type].includes(file.type)) {
      errors.file = `Invalid file type. Allowed types: ${allowedTypes[type].join(', ')}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// Utility function to validate any schema
export const validateSchema = (schema, data) => {
  try {
    return schema.validate(data);
  } catch (error) {
    return {
      isValid: false,
      errors: { general: 'Validation failed' },
    };
  }
};

// Export validation error class
export { ValidationError };
