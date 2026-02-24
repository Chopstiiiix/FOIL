import { test, expect } from '@playwright/test';

test.describe('FOIL Header Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Start a chat to show header actions
    const textarea = page.getByPlaceholder('How can FOIL help you today?');
    await textarea.fill('Create a test project');
    await textarea.press('Enter');

    // Wait for chat to start
    await expect(page.locator('[data-chat-visible="true"]')).toBeVisible();
  });

  test('should show GitHub and Vercel action buttons', async ({ page }) => {
    const githubButton = page.getByTitle('Push to GitHub');
    const vercelButton = page.getByTitle('Deploy to Vercel');

    await expect(githubButton).toBeVisible();
    await expect(vercelButton).toBeVisible();
  });

  test('should open GitHub modal when clicked', async ({ page }) => {
    const githubButton = page.getByTitle('Push to GitHub');
    await githubButton.click();

    // Check modal is open
    const modal = page.getByText('Push to GitHub');
    await expect(modal).toBeVisible();

    const repoNameInput = page.getByPlaceholder('my-foil-project');
    await expect(repoNameInput).toBeVisible();
  });

  test('should open Vercel modal when clicked', async ({ page }) => {
    const vercelButton = page.getByTitle('Deploy to Vercel');
    await vercelButton.click();

    // Check modal is open
    const modal = page.getByText('Deploy to Vercel');
    await expect(modal).toBeVisible();

    const projectNameInput = page.getByPlaceholder('my-awesome-project');
    await expect(projectNameInput).toBeVisible();
  });

  test('should close modals when clicking backdrop', async ({ page }) => {
    // Open GitHub modal
    const githubButton = page.getByTitle('Push to GitHub');
    await githubButton.click();

    // Click backdrop
    await page.locator('.fixed.inset-0').click();

    // Modal should be closed
    const modal = page.getByText('Push to GitHub');
    await expect(modal).not.toBeVisible();
  });

  test('should show workbench and chat toggle buttons', async ({ page }) => {
    const chatButton = page.locator('button:has(div.i-foil\\:chat)');
    const workbenchButton = page.locator('button:has(div.i-ph\\:code-bold)');

    await expect(chatButton).toBeVisible();
    await expect(workbenchButton).toBeVisible();
  });

  test('should toggle workbench view', async ({ page }) => {
    const workbenchButton = page.locator('button:has(div.i-ph\\:code-bold)');
    await workbenchButton.click();

    // Workbench should be visible (this will depend on your implementation)
    // Add appropriate checks based on your workbench component
  });

  test('should validate GitHub form inputs', async ({ page }) => {
    const githubButton = page.getByTitle('Push to GitHub');
    await githubButton.click();

    const deployButton = page.getByRole('button', { name: /Push to GitHub/i });

    // Initially disabled without inputs
    await expect(deployButton).toBeDisabled();

    // Fill required fields
    const repoNameInput = page.getByPlaceholder('my-foil-project');
    const tokenInput = page.getByPlaceholder('ghp_xxxxxxxxxxxx');

    await repoNameInput.fill('test-repo');
    await tokenInput.fill('test-token');

    // Now should be enabled
    await expect(deployButton).toBeEnabled();
  });

  test('should validate Vercel form inputs', async ({ page }) => {
    const vercelButton = page.getByTitle('Deploy to Vercel');
    await vercelButton.click();

    const deployButton = page.getByRole('button', { name: /Deploy to Vercel/i });

    // Initially disabled without inputs
    await expect(deployButton).toBeDisabled();

    // Fill project name
    const projectNameInput = page.getByPlaceholder('my-awesome-project');
    await projectNameInput.fill('test-project');

    // Now should be enabled
    await expect(deployButton).toBeEnabled();
  });
});