import { test, expect } from '@playwright/test';

test.describe('FOIL Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/FOIL/);
  });

  test('should display main heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Navigate your artistic vision/i });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Navigate your artistic vision');
  });

  test('should display tagline', async ({ page }) => {
    const tagline = page.getByText('Bring ideas to life in seconds or get help on existing projects');
    await expect(tagline).toBeVisible();
  });

  test('should have FOIL logo in header', async ({ page }) => {
    const logo = page.getByRole('link', { name: /FOIL/i });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveText('FOIL');
  });

  test('should have chat input textarea', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
  });

  test('should be able to type in chat input', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Create a simple React app');
    await expect(textarea).toHaveValue('Create a simple React app');
  });

  test('should show send button when text is entered', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Hello FOIL');

    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeVisible();
  });

  test('should show enhance prompt button', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Build an app');

    const enhanceButton = page.getByTitle('Enhance prompt');
    await expect(enhanceButton).toBeVisible();
  });

  test('should have responsive design on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      const logo = page.getByRole('link', { name: /FOIL/i });
      await expect(logo).toBeVisible();

      const textarea = page.getByPlaceholder('How can FOIL help you today?');
      await expect(textarea).toBeVisible();
    }
  });
});