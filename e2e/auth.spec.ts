import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Mock the API login response
    await page.route('**/api/auth/jwt/create/', async route => {
      const json = {
        access: 'mock_access_token',
        refresh: 'mock_refresh_token',
        user: {
          id: 1,
          phone_number: '0500000000',
          first_name: 'Test',
          last_name: 'User',
          role: 'admin'
        }
      };
      await route.fulfill({ json });
    });

    // 1. Go to Login Page
    await page.goto('/login');
    
    // 2. Fill Credentials
    await page.fill('input[name="phone"]', '0500000000'); 
    await page.fill('input[name="password"]', 'password');
    
    // 3. Click Login
    await page.click('button[type="submit"]');
    
    // 4. Expect to be redirected to Dashboard
    await expect(page).toHaveURL('/');
    
    // 5. Check for Dashboard Header or Welcome Message
    await expect(page.locator('h1').first()).toContainText('بغدادي للصناعة');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="phone"]', '0500009999');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    // Expect error toast or message (adjust selector based on your Toast component)
    // await expect(page.locator('.sonner-toast')).toBeVisible(); 
  });
});
