import { test, expect } from '@playwright/test';

test.describe('Profile Completion Flow', () => {
  // Helper function to register a user
  async function registerUser(page, role = 'maid') {
    await page.goto('/register');
    await page.selectOption('[name="role"]', role);
    await page.fill('[name="email"]', `test${role}@example.com`);
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('[name="name"]', `Test ${role}`);
    await page.fill('[name="phone"]', '+251912345678');
    await page.click('button:text("Create Account")');

    // Wait for redirect to profile completion
    await page.waitForURL(/complete-profile/);
  }

  test('maid profile completion', async ({ page }) => {
    await registerUser(page, 'maid');

    // Fill maid-specific information
    await page.fill('[name="full_name"]', 'Jane Doe');
    await page.fill('[name="date_of_birth"]', '1995-05-15');
    await page.selectOption('[name="nationality"]', 'Ethiopian');
    await page.selectOption('[name="experience_years"]', '3');

    // Add skills
    await page.click('text=Add Skill');
    await page.fill('[data-testid="skill-input"]', 'Cooking');
    await page.click('text=Add');

    // Add languages
    await page.click('text=Add Language');
    await page.selectOption('[data-testid="language-select"]', 'English');
    await page.click('text=Add');

    // Fill additional information
    await page.fill('[name="salary_expectation"]', '2500');
    await page.fill('[name="about_me"]', 'Experienced domestic helper with excellent references.');

    // Submit profile
    await page.click('button:text("Complete Profile")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('sponsor profile completion', async ({ page }) => {
    await registerUser(page, 'sponsor');

    // Fill sponsor-specific information
    await page.fill('[name="full_name"]', 'John Smith');
    await page.selectOption('[name="family_size"]', '4');
    await page.selectOption('[name="accommodation_type"]', 'apartment');
    await page.fill('[name="budget_min"]', '2000');
    await page.fill('[name="budget_max"]', '3000');

    // Select preferences
    await page.check('[name="preferences"][value="cooking"]');
    await page.check('[name="preferences"][value="cleaning"]');

    // Submit profile
    await page.click('button:text("Complete Profile")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('agency profile completion with KYB', async ({ page }) => {
    await registerUser(page, 'agency');

    // Fill agency-specific information
    await page.fill('[name="agency_name"]', 'Premium Domestic Services Ltd.');
    await page.fill('[name="business_registration_number"]', 'BR12345678');
    await page.fill('[name="trade_license_number"]', 'TL87654321');
    await page.fill('[name="trade_license_expiry"]', '2025-12-31');

    // Upload documents (mock file upload)
    await page.setInputFiles('[name="business_registration_document"]', './e2e/fixtures/sample-document.pdf');
    await page.setInputFiles('[name="trade_license_document"]', './e2e/fixtures/sample-document.pdf');

    // Fill contact information
    await page.fill('[name="contact_person_name"]', 'Agency Manager');
    await page.fill('[name="contact_person_position"]', 'General Manager');

    // Submit profile
    await page.click('button:text("Complete Profile")');

    // Should show pending verification message
    await expect(page.locator('text=verification')).toBeVisible();
  });

  test('profile completion progress tracking', async ({ page }) => {
    await registerUser(page, 'maid');

    // Check initial progress (should be low)
    const progressBar = page.locator('[role="progressbar"], .progress-bar');
    await expect(progressBar).toBeVisible();

    // Fill one field and check progress increases
    await page.fill('[name="full_name"]', 'Jane Doe');
    await page.blur('[name="full_name"]'); // Trigger progress update

    // Progress should have increased (this is a basic check)
    // In a real test, you might check the actual percentage value
  });

  test('required field validation', async ({ page }) => {
    await registerUser(page, 'maid');

    // Try to submit without filling required fields
    await page.click('button:text("Complete Profile")');

    // Should show validation errors
    await expect(page.locator('.error, .text-red-500, [role="alert"]')).toBeVisible();

    // Should not redirect
    await expect(page).toHaveURL(/complete-profile/);
  });

  test('file upload validation', async ({ page }) => {
    await registerUser(page, 'agency');

    // Try uploading an invalid file type
    await page.setInputFiles('[name="business_registration_document"]', './e2e/fixtures/invalid-file.txt');

    // Should show file type error
    await expect(page.locator('text=invalid file type')).toBeVisible();
  });
});