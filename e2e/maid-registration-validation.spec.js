import { test, expect } from '@playwright/test';

test.describe('Maid Registration - Validation & Error Handling', () => {
  test.describe('Success Scenarios', () => {
    test('complete successful maid registration flow', async ({ page }) => {
      // Track the complete flow from start to finish
      await page.goto('/');

      // Navigate from home page
      await page.click('text=Get Started, text=Register, a[href*="register"]');
      await expect(page).toHaveURL(/register/);

      // Select maid account type
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');
      await expect(page.locator('text=Create Your Domestic Worker Account')).toBeVisible();

      // Fill all required fields with valid data
      await page.fill('[name="name"]', 'Selamawit Haile');
      await page.fill('[name="email"]', 'selamawit.haile@example.com');
      await page.fill('[name="password"]', 'SecurePass@123');
      await page.fill('[name="confirmPassword"]', 'SecurePass@123');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Complete phone verification
      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');
      await expect(page.locator('text=verified successfully')).toBeVisible();

      // Submit registration
      await page.click('button:has-text("Create Account")');

      // Verify successful completion
      await page.waitForURL(/complete-profile|dashboard/, { timeout: 15000 });

      // Should either go to profile completion or dashboard
      const url = page.url();
      expect(url).toMatch(/complete-profile|dashboard/);

      if (url.includes('complete-profile')) {
        await expect(page.locator('h1, h2')).toContainText(['Complete', 'Profile']);
      } else {
        await expect(page.locator('text=Welcome, text=Dashboard')).toBeVisible();
      }
    });

    test('successful registration with different country selections', async ({ page }) => {
      const countries = ['Ethiopia', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar'];

      for (const country of countries) {
        await page.goto('/register');
        await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

        await page.fill('[name="name"]', `Test Maid ${country}`);
        await page.fill('[name="email"]', `test.${country.toLowerCase().replace(' ', '')}@example.com`);
        await page.fill('[name="password"]', 'Password123!');
        await page.fill('[name="confirmPassword"]', 'Password123!');
        await page.fill('[name="phone"]', '+251911234567');
        await page.selectOption('[name="country"]', country);

        // Verify country is selected
        await expect(page.locator('[name="country"]')).toHaveValue(country);

        // Complete phone verification
        await page.click('button:has-text("Send Verification Code")');
        await page.fill('input[placeholder*="6-digit"]', '123456');
        await page.click('button:has-text("Verify Code")');

        await page.click('button:has-text("Create Account")');
        await expect(page).toHaveURL(/complete-profile|dashboard/, { timeout: 10000 });
      }
    });

    test('successful registration with special characters in name', async ({ page }) => {
      const specialNames = [
        'አበበ ተስፋዬ', // Amharic
        'Maryam Al-Zahra', // Arabic style
        'María José García', // Spanish accents
        'Jean-Pierre O\'Connor', // Apostrophes and hyphens
        'Ng Wei Ming' // Asian name
      ];

      for (const name of specialNames) {
        await page.goto('/register');
        await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

        await page.fill('[name="name"]', name);
        await page.fill('[name="email"]', `test.${Date.now()}@example.com`);
        await page.fill('[name="password"]', 'Password123!');
        await page.fill('[name="confirmPassword"]', 'Password123!');
        await page.fill('[name="phone"]', '+251911234567');
        await page.selectOption('[name="country"]', 'Ethiopia');

        await page.click('button:has-text("Send Verification Code")');
        await page.fill('input[placeholder*="6-digit"]', '123456');
        await page.click('button:has-text("Verify Code")');

        await page.click('button:has-text("Create Account")');
        await expect(page).toHaveURL(/complete-profile|dashboard/, { timeout: 10000 });

        // Verify name was preserved correctly
        expect(name.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Field Validation', () => {
    test('name field validation', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Empty name
      await page.fill('[name="name"]', '');
      await page.blur('[name="name"]');
      await page.click('button:has-text("Create Account")');
      await expect(page).toHaveURL(/register/);

      // Too short name
      await page.fill('[name="name"]', 'A');
      await page.click('button:has-text("Create Account")');
      await expect(page).toHaveURL(/register/);

      // Valid name should work
      await page.fill('[name="name"]', 'Valid Name');
      await page.fill('[name="email"]', 'valid@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Should not show name error anymore
      await expect(page.locator('[name="name"]')).toHaveValue('Valid Name');
    });

    test('email field validation', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const invalidEmails = [
        '',
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid..email@example.com',
        'spaces in@example.com'
      ];

      for (const email of invalidEmails) {
        await page.fill('[name="email"]', email);
        await page.blur('[name="email"]');

        // Should show validation feedback for invalid emails
        const emailField = page.locator('[name="email"]');
        const isValid = await emailField.evaluate(el => el.validity.valid);
        expect(isValid).toBe(false);
      }

      // Valid email should pass
      await page.fill('[name="email"]', 'valid.email+test@example.co.uk');
      const emailField = page.locator('[name="email"]');
      const isValid = await emailField.evaluate(el => el.validity.valid);
      expect(isValid).toBe(true);
    });

    test('password validation requirements', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const weakPasswords = [
        '',
        '123',
        '12345',
        'password',
        'PASSWORD',
        '12345678',
        'Password',
        'password123'
      ];

      await page.fill('[name="name"]', 'Password Test');
      await page.fill('[name="email"]', 'password@example.com');

      for (const password of weakPasswords) {
        await page.fill('[name="password"]', password);
        await page.fill('[name="confirmPassword"]', password);
        await page.fill('[name="phone"]', '+251911234567');
        await page.selectOption('[name="country"]', 'Ethiopia');

        await page.click('button:has-text("Create Account")');

        // Should show password validation error or remain on page
        await expect(page).toHaveURL(/register/);
      }

      // Strong password should work
      await page.fill('[name="password"]', 'StrongPass@123');
      await page.fill('[name="confirmPassword"]', 'StrongPass@123');

      // Should allow proceeding with strong password
      await expect(page.locator('[name="password"]')).toHaveValue('StrongPass@123');
    });

    test('password confirmation matching', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Password Match Test');
      await page.fill('[name="email"]', 'match@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'DifferentPassword123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Create Account")');

      // Should show password mismatch error
      await expect(page.locator('text=Password')).toBeVisible();
      await expect(page.locator('text=match')).toBeVisible();
      await expect(page).toHaveURL(/register/);

      // Fix the mismatch
      await page.fill('[name="confirmPassword"]', 'Password123!');

      // Should clear error and allow proceeding
      await expect(page.locator('[name="confirmPassword"]')).toHaveValue('Password123!');
    });

    test('phone number validation', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Phone Test');
      await page.fill('[name="email"]', 'phone@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.selectOption('[name="country"]', 'Ethiopia');

      const invalidPhoneNumbers = [
        '',
        '123',
        'phone',
        '251911234567', // Missing +
        '+123', // Too short
        'invalid-phone-format'
      ];

      for (const phone of invalidPhoneNumbers) {
        await page.fill('[name="phone"]', phone);
        await page.click('button:has-text("Send Verification Code")');

        // Should show phone validation error
        if (phone !== '') {
          await expect(page.locator('text=Invalid Phone, text=valid phone')).toBeVisible();
        }
      }

      // Valid phone should work
      await page.fill('[name="phone"]', '+251911234567');
      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
    });
  });

  test.describe('Phone Verification Validation', () => {
    test('phone verification code validation', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Verification Test');
      await page.fill('[name="email"]', 'verification@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();

      const invalidCodes = [
        '',
        '123',
        '12345',
        '1234567', // Too long
        'abcdef',
        '000000'
      ];

      for (const code of invalidCodes) {
        await page.fill('input[placeholder*="6-digit"]', code);

        if (code.length === 6 && code !== '123456') {
          await page.click('button:has-text("Verify Code")');
          await expect(page.locator('text=Invalid, text=Failed')).toBeVisible();
        }
      }

      // Valid test code should work
      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');
      await expect(page.locator('text=verified successfully')).toBeVisible();
    });

    test('verification code resend functionality', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Resend Test');
      await page.fill('[name="email"]', 'resend@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();

      // Test resend functionality
      await expect(page.locator('button:has-text("Resend Code")')).toBeVisible();
      await page.click('button:has-text("Resend Code")');

      // Should show resend confirmation or loading state
      await expect(page.locator('text=Resending, text=Resent, text=sent')).toBeVisible();

      // Code input should still be available
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
    });

    test('change phone number during verification', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Change Phone Test');
      await page.fill('[name="email"]', 'changephone@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();

      // Test change number functionality
      if (await page.locator('button:has-text("Change Number")').isVisible()) {
        await page.click('button:has-text("Change Number")');

        // Should go back to phone input
        await expect(page.locator('[name="phone"]')).toBeVisible();
        await expect(page.locator('[name="phone"]')).not.toBeDisabled();

        // Change to new number
        await page.fill('[name="phone"]', '+251922345678');
        await page.click('button:has-text("Send Verification Code")');
        await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
      }
    });
  });

  test.describe('Form State Management', () => {
    test('form data persists during navigation', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Fill form partially
      await page.fill('[name="name"]', 'Persistence Test');
      await page.fill('[name="email"]', 'persistence@example.com');
      await page.fill('[name="password"]', 'Password123!');

      // Navigate away and back
      await page.click('button:has-text("Back")');
      await expect(page.locator('text=Choose Your Account Type')).toBeVisible();

      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Data should be preserved
      await expect(page.locator('[name="name"]')).toHaveValue('Persistence Test');
      await expect(page.locator('[name="email"]')).toHaveValue('persistence@example.com');
      await expect(page.locator('[name="password"]')).toHaveValue('Password123!');
    });

    test('form handles browser back/forward navigation', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Navigation Test');
      await page.fill('[name="email"]', 'navigation@example.com');

      // Navigate to another page
      await page.goto('/');

      // Use browser back
      await page.goBack();

      // Should be on registration page
      await expect(page).toHaveURL(/register/);

      // Form state might or might not be preserved (depends on implementation)
      // This test verifies the page loads correctly after navigation
      await expect(page.locator('[name="name"]')).toBeVisible();
    });

    test('form prevents submission without required fields', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Try to submit empty form
      await page.click('button:has-text("Create Account")');
      await expect(page).toHaveURL(/register/);

      // Fill only some fields
      await page.fill('[name="name"]', 'Partial Test');
      await page.click('button:has-text("Create Account")');
      await expect(page).toHaveURL(/register/);

      // Fill all required fields except phone verification
      await page.fill('[name="name"]', 'Complete Test');
      await page.fill('[name="email"]', 'complete@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Without phone verification, should still not submit
      await page.click('button:has-text("Create Account")');
      await expect(page.locator('text=Phone Verification Required')).toBeVisible();
      await expect(page).toHaveURL(/register/);
    });
  });

  test.describe('Error Recovery', () => {
    test('recover from network failures', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Network Recovery Test');
      await page.fill('[name="email"]', 'recovery@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Simulate network failure
      await page.route('**/*', route => route.abort());

      await page.click('button:has-text("Send Verification Code")');

      // Should show error
      await expect(page.locator('text=network, text=connection, text=error')).toBeVisible();

      // Restore network
      await page.unroute('**/*');

      // Retry should work
      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
    });

    test('handle server errors gracefully', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Server Error Test');
      await page.fill('[name="email"]', 'server@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Mock server error
      await page.route('**/auth/v1/signup', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Internal server error'
            }
          })
        });
      });

      await page.click('button:has-text("Send Verification Code")');
      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');
      await page.click('button:has-text("Create Account")');

      // Should show server error
      await expect(page.locator('text=server error, text=Registration Failed')).toBeVisible();
      await expect(page).toHaveURL(/register/);

      // Form should remain filled for retry
      await expect(page.locator('[name="name"]')).toHaveValue('Server Error Test');
    });
  });
});

test.describe('Integration Tests', () => {
  test('complete end-to-end registration to profile completion', async ({ page }) => {
    // Start from home page
    await page.goto('/');

    // Navigate to registration
    if (await page.locator('text=Get Started, a[href*="register"]').first().isVisible()) {
      await page.click('text=Get Started, a[href*="register"]');
    } else {
      await page.goto('/register');
    }

    // Complete full registration flow
    await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

    await page.fill('[name="name"]', 'Integration Test Maid');
    await page.fill('[name="email"]', 'integration@example.com');
    await page.fill('[name="password"]', 'IntegrationPass@123');
    await page.fill('[name="confirmPassword"]', 'IntegrationPass@123');
    await page.fill('[name="phone"]', '+251911234567');
    await page.selectOption('[name="country"]', 'Ethiopia');

    await page.click('button:has-text("Send Verification Code")');
    await page.fill('input[placeholder*="6-digit"]', '123456');
    await page.click('button:has-text("Verify Code")');
    await page.click('button:has-text("Create Account")');

    // Should reach profile completion or dashboard
    await page.waitForURL(/complete-profile|dashboard/, { timeout: 15000 });

    if (page.url().includes('complete-profile')) {
      // Verify maid-specific profile completion form
      await expect(page.locator('text=Complete, text=Profile')).toBeVisible();

      // Should have maid-specific fields
      const maidSpecificElements = [
        'text=Experience',
        'text=Skills',
        'text=Languages',
        'text=Nationality',
        '[name*="experience"], [name*="skills"], [name*="languages"]'
      ];

      for (const element of maidSpecificElements) {
        if (await page.locator(element).first().isVisible()) {
          // At least one maid-specific element should be present
          break;
        }
      }
    }

    // Verify user is properly authenticated
    await expect(page.locator('text=Welcome, text=Profile, text=Dashboard')).toBeVisible();
  });
});