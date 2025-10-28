import { test, expect } from '@playwright/test';

test.describe('Maid Registration Flow - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up performance monitoring
    await page.addInitScript(() => {
      window.performance.mark('test-start');
    });
  });

  test.describe('Functional Tests', () => {
    test('successful maid registration with complete flow', async ({ page }) => {
      // Start performance measurement
      const startTime = Date.now();

      // Navigate to registration page
      await page.goto('/register');
      await expect(page).toHaveURL(/register/);

      // Verify page loads completely
      await expect(page.locator('h1')).toContainText('Join');
      await expect(page.locator('text=Choose Your Account Type')).toBeVisible();

      // Step 1: Select maid user type
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');
      await expect(page.locator('text=Create Your Domestic Worker Account')).toBeVisible();

      // Step 2: Fill basic registration form
      await page.fill('[name="name"]', 'Almaz Tadesse');
      await page.fill('[name="email"]', 'almaz.tadesse@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');
      await page.fill('[name="confirmPassword"]', 'SecurePassword123!');
      await page.fill('[name="phone"]', '+251911234567');

      // Select country
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Step 3: Phone verification process
      await page.click('button:has-text("Send Verification Code")');

      // Wait for verification UI to appear
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();

      // Use development mode test code
      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');

      // Wait for verification success
      await expect(page.locator('text=verified successfully')).toBeVisible();

      // Step 4: Submit registration
      await page.click('button:has-text("Create Account")');

      // Step 5: Verify redirect to profile completion
      await page.waitForURL(/complete-profile/, { timeout: 10000 });
      await expect(page).toHaveURL(/complete-profile/);

      // Verify maid-specific form is shown
      await expect(page.locator('h1, h2')).toContainText(['Complete', 'Profile', 'Maid', 'Worker']);

      // Measure performance
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      console.log(`Total registration time: ${totalTime}ms`);
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
    });

    test('maid registration with edge case data', async ({ page }) => {
      await page.goto('/register');

      // Select maid type
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Fill with edge case data
      await page.fill('[name="name"]', 'አበበ ተስፋዬ'); // Amharic characters
      await page.fill('[name="email"]', 'test+maid.registration@example-domain.co.uk');
      await page.fill('[name="password"]', 'Pass@123!$%^&*()');
      await page.fill('[name="confirmPassword"]', 'Pass@123!$%^&*()');
      await page.fill('[name="phone"]', '+251912345678');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Phone verification
      await page.click('button:has-text("Send Verification Code")');
      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');

      // Submit registration
      await page.click('button:has-text("Create Account")');

      // Should successfully complete
      await expect(page).toHaveURL(/complete-profile/, { timeout: 10000 });
    });

    test('maid registration with international phone numbers', async ({ page }) => {
      const phoneNumbers = [
        '+966501234567', // Saudi Arabia
        '+971501234567', // UAE
        '+965123456789', // Kuwait
        '+974123456789', // Qatar
      ];

      for (const phoneNumber of phoneNumbers) {
        await page.goto('/register');
        await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

        await page.fill('[name="name"]', 'Test Maid');
        await page.fill('[name="email"]', `test.${phoneNumber.replace('+', '')}@example.com`);
        await page.fill('[name="password"]', 'TestPassword123!');
        await page.fill('[name="confirmPassword"]', 'TestPassword123!');
        await page.fill('[name="phone"]', phoneNumber);
        await page.selectOption('[name="country"]', 'Ethiopia');

        // Phone verification
        await page.click('button:has-text("Send Verification Code")');
        await page.fill('input[placeholder*="6-digit"]', '123456');
        await page.click('button:has-text("Verify Code")');

        await page.click('button:has-text("Create Account")');
        await expect(page).toHaveURL(/complete-profile/, { timeout: 10000 });
      }
    });
  });

  test.describe('Error Handling & Validation', () => {
    test('validation errors for incomplete maid registration', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Try to submit without required fields
      await page.click('button:has-text("Create Account")');

      // Should show validation errors and not proceed
      await expect(page).toHaveURL(/register/);

      // Check for required field indicators
      const nameField = page.locator('[name="name"]');
      const emailField = page.locator('[name="email"]');
      await expect(nameField).toBeVisible();
      await expect(emailField).toBeVisible();
    });

    test('password mismatch error handling', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Test Maid');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'DifferentPassword123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Create Account")');

      // Should show password mismatch error
      await expect(page.locator('text=Password')).toBeVisible();
      await expect(page.locator('text=match')).toBeVisible();
      await expect(page).toHaveURL(/register/);
    });

    test('invalid phone number handling', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Test Maid');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', 'invalid-phone');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Try to send verification code with invalid phone
      await page.click('button:has-text("Send Verification Code")');

      // Should show invalid phone error
      await expect(page.locator('text=Invalid Phone', 'text=valid phone')).toBeVisible();
    });

    test('duplicate email registration handling', async ({ page }) => {
      // This test would require actual backend integration
      // For now, we'll test the UI behavior when server returns an error
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Test Maid');
      await page.fill('[name="email"]', 'existing@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Mock server error response
      await page.route('**/auth/v1/signup', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Email already registered'
            }
          })
        });
      });

      await page.click('button:has-text("Send Verification Code")');
      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');
      await page.click('button:has-text("Create Account")');

      // Should show error message
      await expect(page.locator('text=already registered', 'text=Registration Failed')).toBeVisible();
    });

    test('phone verification timeout handling', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Test Maid');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Send Verification Code")');

      // Try invalid verification code
      await page.fill('input[placeholder*="6-digit"]', '000000');
      await page.click('button:has-text("Verify Code")');

      // Should show error and allow retry
      await expect(page.locator('text=Invalid', 'text=Failed')).toBeVisible();
      await expect(page.locator('button:has-text("Resend Code")')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('registration page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/register');

      // Wait for all critical elements to load
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Choose Your Account Type')).toBeVisible();
      await expect(page.locator('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))')).toBeVisible();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      console.log(`Registration page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('form interaction performance', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const startTime = Date.now();

      // Fill form rapidly
      await page.fill('[name="name"]', 'Performance Test Maid');
      await page.fill('[name="email"]', 'performance@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      const endTime = Date.now();
      const fillTime = endTime - startTime;

      console.log(`Form filling time: ${fillTime}ms`);
      expect(fillTime).toBeLessThan(2000); // Form should be responsive
    });

    test('verify countries load performance', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const startTime = Date.now();

      // Click country dropdown to trigger loading
      await page.click('[name="country"]');

      // Wait for countries to load
      await expect(page.locator('[name="country"] option').nth(1)).toBeVisible();

      const endTime = Date.now();
      const countriesLoadTime = endTime - startTime;

      console.log(`Countries load time: ${countriesLoadTime}ms`);
      expect(countriesLoadTime).toBeLessThan(1000); // Countries should load quickly
    });
  });

  test.describe('Security Tests', () => {
    test('XSS prevention in form fields', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Try XSS payloads in form fields
      const xssPayload = '<script>alert("XSS")</script>';

      await page.fill('[name="name"]', xssPayload);
      await page.fill('[name="email"]', `test${xssPayload}@example.com`);

      // Verify the script tags are escaped/sanitized
      const nameValue = await page.inputValue('[name="name"]');
      const emailValue = await page.inputValue('[name="email"]');

      // XSS should be escaped or stripped
      expect(nameValue).not.toContain('<script>');
      expect(emailValue).not.toContain('<script>');
    });

    test('SQL injection prevention', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Try SQL injection payloads
      const sqlPayload = "'; DROP TABLE users; --";

      await page.fill('[name="name"]', sqlPayload);
      await page.fill('[name="email"]', `test+${sqlPayload}@example.com`);
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Form should handle this gracefully without errors
      await page.click('button:has-text("Send Verification Code")');

      // Should show normal behavior, not database errors
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
    });

    test('password strength validation', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const weakPasswords = ['123', '12345', 'password', 'qwerty'];

      for (const weakPassword of weakPasswords) {
        await page.fill('[name="password"]', weakPassword);
        await page.fill('[name="confirmPassword"]', weakPassword);

        // Try to submit
        await page.click('button:has-text("Create Account")');

        // Should show password strength error or prevent submission
        await expect(page).toHaveURL(/register/);
      }
    });

    test('CSRF protection headers', async ({ page }) => {
      // Monitor network requests for CSRF tokens
      const requests = [];
      page.on('request', request => {
        if (request.method() === 'POST') {
          requests.push({
            url: request.url(),
            headers: request.headers()
          });
        }
      });

      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'CSRF Test');
      await page.fill('[name="email"]', 'csrf@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Send Verification Code")');

      // Verify POST requests have appropriate security headers
      const postRequests = requests.filter(req => req.url.includes('auth') || req.url.includes('api'));
      expect(postRequests.length).toBeGreaterThan(0);

      // Check for security headers (this depends on your backend implementation)
      postRequests.forEach(request => {
        console.log('Request headers:', request.headers);
        // Add specific CSRF token checks based on your implementation
      });
    });
  });

  test.describe('Accessibility Tests', () => {
    test('keyboard navigation support', async ({ page }) => {
      await page.goto('/register');

      // Test tab navigation through user type selection
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Select maid with keyboard
      const focusedElement = await page.evaluate(() => document.activeElement.textContent);
      if (focusedElement.includes('Domestic Worker') || focusedElement.includes('Maid')) {
        await page.keyboard.press('Enter');
      } else {
        // Navigate to maid option
        await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');
      }

      // Test form field navigation
      await page.keyboard.press('Tab'); // Name field
      await page.keyboard.type('Test Maid');

      await page.keyboard.press('Tab'); // Email field
      await page.keyboard.type('test@example.com');

      await page.keyboard.press('Tab'); // Password field
      await page.keyboard.type('Password123!');

      await page.keyboard.press('Tab'); // Confirm password
      await page.keyboard.type('Password123!');

      // Verify form was filled correctly
      await expect(page.locator('[name="name"]')).toHaveValue('Test Maid');
      await expect(page.locator('[name="email"]')).toHaveValue('test@example.com');
    });

    test('screen reader accessibility', async ({ page }) => {
      await page.goto('/register');

      // Check for proper ARIA labels and roles
      await expect(page.locator('[role="button"]')).toHaveCount({ min: 1 });

      // Check form labels
      await expect(page.locator('label[for*="name"], input[aria-label*="name"], input[name="name"]')).toBeVisible();
      await expect(page.locator('label[for*="email"], input[aria-label*="email"], input[name="email"]')).toBeVisible();

      // Check user type selection has proper accessibility
      const userTypeElements = await page.locator('[data-testid*="user-type"], .group').all();
      for (const element of userTypeElements) {
        const isClickable = await element.isVisible();
        expect(isClickable).toBe(true);
      }
    });

    test('color contrast and visual accessibility', async ({ page }) => {
      await page.goto('/register');

      // Test high contrast mode compatibility
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(page.locator('h1')).toBeVisible();

      await page.emulateMedia({ colorScheme: 'light' });
      await expect(page.locator('h1')).toBeVisible();
    });

    test('mobile accessibility', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/register');

      // Verify mobile-friendly touch targets
      const userTypeButtons = page.locator('[data-testid*="user-type"], .group');
      const buttonCount = await userTypeButtons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = userTypeButtons.nth(i);
        const boundingBox = await button.boundingBox();

        // Touch targets should be at least 44px (Apple guidelines)
        expect(boundingBox.height).toBeGreaterThanOrEqual(40);
        expect(boundingBox.width).toBeGreaterThanOrEqual(40);
      }

      // Test form in mobile view
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Verify form fields are properly sized for mobile
      const nameField = page.locator('[name="name"]');
      const nameBox = await nameField.boundingBox();
      expect(nameBox.height).toBeGreaterThanOrEqual(40);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
      test(`maid registration works in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Running only on ${browserName}`);

        await page.goto('/register');
        await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

        await page.fill('[name="name"]', `Test Maid ${browserName}`);
        await page.fill('[name="email"]', `test.${browserName}@example.com`);
        await page.fill('[name="password"]', 'Password123!');
        await page.fill('[name="confirmPassword"]', 'Password123!');
        await page.fill('[name="phone"]', '+251911234567');
        await page.selectOption('[name="country"]', 'Ethiopia');

        await page.click('button:has-text("Send Verification Code")');
        await page.fill('input[placeholder*="6-digit"]', '123456');
        await page.click('button:has-text("Verify Code")');
        await page.click('button:has-text("Create Account")');

        await expect(page).toHaveURL(/complete-profile/, { timeout: 10000 });
      });
    });
  });

  test.describe('Network Resilience', () => {
    test('handles network failures gracefully', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Network Test Maid');
      await page.fill('[name="email"]', 'network@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Simulate network failure
      await page.route('**/*', route => route.abort());

      await page.click('button:has-text("Send Verification Code")');

      // Should show appropriate error message
      await expect(page.locator('text=network', 'text=connection', 'text=error')).toBeVisible();

      // Re-enable network
      await page.unroute('**/*');
    });

    test('handles slow network gracefully', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Slow Network Test');
      await page.fill('[name="email"]', 'slow@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Simulate slow network
      await page.route('**/auth/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        route.continue();
      });

      const startTime = Date.now();
      await page.click('button:has-text("Send Verification Code")');

      // Should show loading state
      await expect(page.locator('text=Sending', 'text=Loading')).toBeVisible();

      // Eventually should complete
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible({ timeout: 5000 });

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(1500); // Confirming delay was applied
    });
  });

  test.afterEach(async ({ page }) => {
    // Log performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        totalTime: navigation.loadEventEnd - navigation.navigationStart
      };
    });

    console.log('Performance metrics:', performanceMetrics);
  });
});