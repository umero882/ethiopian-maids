import { test, expect } from '@playwright/test';

test.describe('Search and Matching Flow', () => {
  // Helper function to login as sponsor
  async function loginAsSponsor(page) {
    await page.goto('/login');
    await page.fill('[name="email"]', 'testsponsor@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button:text("Sign In")');
    await page.waitForURL(/dashboard/);
  }

  test('sponsor can search for maids', async ({ page }) => {
    await loginAsSponsor(page);

    // Navigate to search page
    await page.click('text=Find Maids');
    await expect(page).toHaveURL(/search/);

    // Use search filters
    await page.selectOption('[name="nationality"]', 'Ethiopian');
    await page.selectOption('[name="experience"]', '2-5');
    await page.selectOption('[name="skills"]', 'Cooking');

    // Apply filters
    await page.click('button:text("Search")');

    // Should show search results
    await expect(page.locator('[data-testid="maid-card"]')).toBeVisible();
    await expect(page.locator('text=results found')).toBeVisible();
  });

  test('sponsor can view maid profile details', async ({ page }) => {
    await loginAsSponsor(page);
    await page.goto('/search');

    // Click on first maid profile
    await page.click('[data-testid="maid-card"]:first-child');

    // Should navigate to maid detail page
    await expect(page).toHaveURL(/maid\//);

    // Should show maid details
    await expect(page.locator('[data-testid="maid-profile"]')).toBeVisible();
    await expect(page.locator('text=Experience')).toBeVisible();
    await expect(page.locator('text=Skills')).toBeVisible();
  });

  test('sponsor can contact a maid', async ({ page }) => {
    await loginAsSponsor(page);
    await page.goto('/search');

    // View maid profile
    await page.click('[data-testid="maid-card"]:first-child');

    // Click contact button
    await page.click('button:text("Contact")');

    // Should open contact modal/form
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill contact message
    await page.fill('[name="message"]', 'I am interested in hiring you. When would you be available?');

    // Send message
    await page.click('button:text("Send Message")');

    // Should show success message
    await expect(page.locator('text=Message sent')).toBeVisible();
  });

  test('advanced search filters work correctly', async ({ page }) => {
    await loginAsSponsor(page);
    await page.goto('/search');

    // Apply multiple filters
    await page.selectOption('[name="nationality"]', 'Ethiopian');
    await page.selectOption('[name="age_range"]', '25-35');
    await page.selectOption('[name="experience"]', '3-5');
    await page.fill('[name="salary_max"]', '3000');

    // Select skills
    await page.check('[name="skills"][value="cooking"]');
    await page.check('[name="skills"][value="cleaning"]');

    // Apply filters
    await page.click('button:text("Search")');

    // Verify filtered results
    const results = page.locator('[data-testid="maid-card"]');
    await expect(results).toHaveCount({ min: 0 }); // Could be 0 if no matches

    // Check that filters are preserved
    await expect(page.locator('[name="nationality"]')).toHaveValue('Ethiopian');
  });

  test('sponsor can save favorite maids', async ({ page }) => {
    await loginAsSponsor(page);
    await page.goto('/search');

    // Click favorite button on first maid
    await page.click('[data-testid="favorite-button"]:first-child');

    // Should show favorited state
    await expect(page.locator('[data-testid="favorite-button"]:first-child')).toHaveClass(/favorited/);

    // Navigate to favorites page
    await page.click('text=My Favorites');

    // Should show the favorited maid
    await expect(page.locator('[data-testid="maid-card"]')).toBeVisible();
  });

  test('search results pagination', async ({ page }) => {
    await loginAsSponsor(page);
    await page.goto('/search');

    // If there are multiple pages
    const nextButton = page.locator('button:text("Next")');
    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Should navigate to next page
      await expect(page).toHaveURL(/page=2/);

      // Should show different results
      await expect(page.locator('[data-testid="maid-card"]')).toBeVisible();
    }
  });

  test('no results message', async ({ page }) => {
    await loginAsSponsor(page);
    await page.goto('/search');

    // Apply very restrictive filters that should return no results
    await page.selectOption('[name="nationality"]', 'Rare_Nationality');
    await page.selectOption('[name="experience"]', '10+');
    await page.fill('[name="salary_max"]', '100'); // Very low salary

    await page.click('button:text("Search")');

    // Should show no results message
    await expect(page.locator('text=No maids found')).toBeVisible();
    await expect(page.locator('text=Try adjusting your filters')).toBeVisible();
  });
});