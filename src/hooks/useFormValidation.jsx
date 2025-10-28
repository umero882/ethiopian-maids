/**
 * 🛡️ Form Validation Hook
 * Unified form validation using validation schemas
 */

import { useState, useCallback, useEffect } from 'react';
import {
  userRegistrationSchema,
  maidProfileSchema,
  sponsorProfileSchema,
  jobPostingSchema,
  fileUploadSchema,
  validateSchema,
  ValidationError,
} from '@/lib/validationSchemas';
import { handleValidationError } from '@/services/centralizedErrorHandler';

// Validation schema mapping
const VALIDATION_SCHEMAS = {
  userRegistration: userRegistrationSchema,
  maidProfile: maidProfileSchema,
  sponsorProfile: sponsorProfileSchema,
  jobPosting: jobPostingSchema,
  fileUpload: fileUploadSchema,
};

export const useFormValidation = (schemaName, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showErrorsImmediately = false,
    onValidationChange,
  } = options;

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const schema = VALIDATION_SCHEMAS[schemaName];

  if (!schema) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }

  // Validate entire form
  const validateForm = useCallback(
    async (data) => {
      setIsValidating(true);

      try {
        const result = validateSchema(schema, data);

        setErrors(result.errors || {});
        setIsValid(result.isValid);

        if (onValidationChange) {
          onValidationChange(result.isValid, result.errors);
        }

        return result;
      } catch (error) {
        await handleValidationError(error);
        return { isValid: false, errors: { general: 'Validation failed' } };
      } finally {
        setIsValidating(false);
      }
    },
    [schema, onValidationChange]
  );

  // Validate single field
  const validateField = useCallback(
    async (fieldName, value, allData = {}) => {
      if (!validateOnChange && !touched[fieldName]) {
        return;
      }

      try {
        // Create partial data object for field validation
        const fieldData = { ...allData, [fieldName]: value };
        const result = validateSchema(schema, fieldData);

        setErrors((prev) => ({
          ...prev,
          [fieldName]: result.errors[fieldName] || null,
        }));

        return !result.errors[fieldName];
      } catch (error) {
        await handleValidationError(error);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: 'Validation error',
        }));
        return false;
      }
    },
    [schema, validateOnChange, touched]
  );

  // Mark field as touched
  const touchField = useCallback((fieldName) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  }, []);

  // Handle field blur
  const handleBlur = useCallback(
    async (fieldName, value, allData = {}) => {
      touchField(fieldName);

      if (validateOnBlur) {
        await validateField(fieldName, value, allData);
      }
    },
    [validateOnBlur, validateField, touchField]
  );

  // Handle field change
  const handleChange = useCallback(
    async (fieldName, value, allData = {}) => {
      if (validateOnChange && (touched[fieldName] || showErrorsImmediately)) {
        await validateField(fieldName, value, allData);
      }
    },
    [validateOnChange, validateField, touched, showErrorsImmediately]
  );

  // Get field error
  const getFieldError = useCallback(
    (fieldName) => {
      return errors[fieldName];
    },
    [errors]
  );

  // Check if field has error
  const hasFieldError = useCallback(
    (fieldName) => {
      return Boolean(errors[fieldName]);
    },
    [errors]
  );

  // Check if field is touched
  const isFieldTouched = useCallback(
    (fieldName) => {
      return Boolean(touched[fieldName]);
    },
    [touched]
  );

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, []);

  // Clear specific field error
  const clearFieldError = useCallback((fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Reset validation state
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValid(false);
    setIsValidating(false);
  }, []);

  return {
    // State
    errors,
    touched,
    isValid,
    isValidating,

    // Methods
    validateForm,
    validateField,
    touchField,
    handleBlur,
    handleChange,
    getFieldError,
    hasFieldError,
    isFieldTouched,
    clearErrors,
    clearFieldError,
    reset,
  };
};

// Specialized hooks for common forms
export const useRegistrationValidation = (options = {}) => {
  return useFormValidation('userRegistration', options);
};

export const useMaidProfileValidation = (options = {}) => {
  return useFormValidation('maidProfile', options);
};

export const useSponsorProfileValidation = (options = {}) => {
  return useFormValidation('sponsorProfile', options);
};

export const useJobPostingValidation = (options = {}) => {
  return useFormValidation('jobPosting', options);
};

export const useFileUploadValidation = (options = {}) => {
  return useFormValidation('fileUpload', options);
};

// Higher-order component for form validation
export const withFormValidation = (Component, schemaName, options = {}) => {
  return (props) => {
    const validation = useFormValidation(schemaName, options);

    return <Component {...props} validation={validation} />;
  };
};

// Validation context for complex forms
import { createContext, useContext } from 'react';

const ValidationContext = createContext(null);

export const ValidationProvider = ({ children, schemaName, options = {} }) => {
  const validation = useFormValidation(schemaName, options);

  return (
    <ValidationContext.Provider value={validation}>
      {children}
    </ValidationContext.Provider>
  );
};

export const useValidationContext = () => {
  const context = useContext(ValidationContext);

  if (!context) {
    throw new Error(
      'useValidationContext must be used within a ValidationProvider'
    );
  }

  return context;
};

// Utility functions
export const createFieldProps = (validation, fieldName, allData = {}) => {
  return {
    error: validation.getFieldError(fieldName),
    hasError: validation.hasFieldError(fieldName),
    isTouched: validation.isFieldTouched(fieldName),
    onBlur: (e) => validation.handleBlur(fieldName, e.target.value, allData),
    onChange: (e) =>
      validation.handleChange(fieldName, e.target.value, allData),
  };
};

// Real-time validation hook
export const useRealtimeValidation = (schemaName, data, options = {}) => {
  const { debounceMs = 300 } = options;
  const [validationResult, setValidationResult] = useState({
    isValid: false,
    errors: {},
  });
  const validation = useFormValidation(schemaName, { validateOnChange: false });

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (data && Object.keys(data).length > 0) {
        const result = await validation.validateForm(data);
        setValidationResult(result);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, debounceMs, validation]);

  return validationResult;
};
