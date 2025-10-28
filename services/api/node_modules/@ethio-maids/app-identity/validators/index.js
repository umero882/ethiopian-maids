/**
 * Input Validators for Identity Use Cases
 *
 * Validates command/query inputs before execution.
 */

import { IdentityPolicies } from '@ethio-maids/domain-identity';

export const RegisterUserValidator = {
  validate(command) {
    const errors = [];

    if (!command.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!IdentityPolicies.isValidEmail(command.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!command.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (!IdentityPolicies.isPasswordStrong(command.password)) {
      errors.push({
        field: 'password',
        message: 'Password does not meet strength requirements',
      });
    }

    if (!command.role) {
      errors.push({ field: 'role', message: 'Role is required' });
    } else if (!['maid', 'sponsor', 'agency'].includes(command.role)) {
      errors.push({ field: 'role', message: 'Invalid role' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    return true;
  },
};

export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
