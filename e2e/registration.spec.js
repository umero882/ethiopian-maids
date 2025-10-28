import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/register/);
  });

  test('maid registration flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');

    // Select maid role
    await page.selectOption('[name="role"]', 'maid');

    // Fill basic information
    await page.fill('[name="email"]', 'testmaid@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('[name="name"]', 'Test Maid');
    await page.fill('[name="phone"]', '+251912345678');

    // Submit registration form
    await page.click('button:text("Create Account")');

    // Should redirect to profile completion
    await expect(page).toHaveURL(/complete-profile/);

    // Verify welcome message or profile form is shown
    await expect(page.locator('h1')).toContainText(['Welcome', 'Complete', 'Profile']);
  });

  test('sponsor registration flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');

    // Select sponsor role
    await page.selectOption('[name="role"]', 'sponsor');

    // Fill basic information
    await page.fill('[name="email"]', 'testsponsor@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('[name="name"]', 'Test Sponsor');
    await page.fill('[name="phone"]', '+966512345678');

    // Submit registration form
    await page.click('button:text("Create Account")');

    // Should redirect to profile completion
    await expect(page).toHaveURL(/complete-profile/);
  });

  test('agency registration flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');

    // Select agency role
    await page.selectOption('[name="role"]', 'agency');

    // Fill basic information
    await page.fill('[name="email"]', 'testagency@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('[name="name"]', 'Test Agency Ltd.');
    await page.fill('[name="phone"]', '+251911223344');

    // Submit registration form
    await page.click('button:text("Create Account")');

    // Should redirect to profile completion
    await expect(page).toHaveURL(/complete-profile/);
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Try to submit without filling required fields
    await page.click('button:text("Create Account")');

    // Should show validation errors
    await expect(page.locator('.error, .text-red-500, [role="alert"]')).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    await page.selectOption('[name="role"]', 'maid');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button:text("Create Account")');

    // Should show password mismatch error
    await expect(page.locator('text=password').locator('text=match')).toBeVisible();
  });
});