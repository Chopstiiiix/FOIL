import { test, expect } from '@playwright/test';

test.describe('FOIL Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should start a chat session', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Create a simple HTML page');

    // Press Enter to send message
    await textarea.press('Enter');

    // Check that chat has started
    const messagesContainer = page.locator('[data-chat-visible="true"]');
    await expect(messagesContainer).toBeVisible();
  });

  test('should show workbench toggle after chat starts', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Create a React component');
    await textarea.press('Enter');

    // Wait for chat to start and check for workbench toggle
    await expect(page.locator('[data-chat-visible="true"]')).toBeVisible();

    const workbenchToggle = page.locator('button:has(div.i-ph\\:code-bold)');
    await expect(workbenchToggle).toBeVisible();
  });

  test('should support multiline input with Shift+Enter', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Create a form');
    await textarea.press('Shift+Enter');
    await textarea.fill('Create a form\nwith validation');

    await expect(textarea).toHaveValue('Create a form\nwith validation');
  });

  test('should show keyboard shortcut hint', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Some text that is long enough to trigger the hint');

    const hint = page.getByText('Use Shift + Return for a new line');
    await expect(hint).toBeVisible();
  });

  test('should handle empty input gracefully', async ({ page }) => {
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.press('Enter');

    // Should not start chat with empty input
    const messagesContainer = page.locator('[data-chat-visible="true"]');
    await expect(messagesContainer).not.toBeVisible();
  });
});