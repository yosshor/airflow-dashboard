const { test, expect } = require('@playwright/test');

/**
 * Navigation Tests for Airflow Dashboard
 * 
 * Tests the main navigation functionality, ensuring all pages load correctly
 * and navigation links work as expected.
 */
test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should load the home page (Add Task)', async ({ page }) => {
    // Check that we're on the Add Task page
    await expect(page.locator('h1')).toContainText('🚀 Trigger Airflow DAG');
    
    // Verify the form elements are present
    await expect(page.locator('input[id="dagId"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('🚀 Trigger DAG');
  });

  test('should navigate to Task List page', async ({ page }) => {
    // Click the Task List link
    await page.click('a[href="/tasks"]');
    
    // Verify we're on the Task List page
    await expect(page.locator('h2')).toContainText('DAG Runs for:');
    await expect(page.locator('span')).toContainText('test_hello_world');
  });

  test('should navigate to All DAGs page', async ({ page }) => {
    // Click the All DAGs link
    await page.click('a[href="/all-dags"]');
    
    // Verify we're on the All DAGs page
    await expect(page).toHaveURL('/all-dags');
    
    // Check for common elements (adjust based on your actual AllDagRuns component)
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should navigate to Task Logs page', async ({ page }) => {
    // Click the Task Logs link
    await page.click('a[href="/logs"]');
    
    // Verify we're on the Task Logs page
    await expect(page).toHaveURL('/logs');
    
    // Check for common elements (adjust based on your actual ShowTaskLogs component)
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should navigate to DAG Run Explorer page', async ({ page }) => {
    // Click the Explore DAG Runs link
    await page.click('a[href="/explorer"]');
    
    // Verify we're on the Explorer page
    await expect(page).toHaveURL('/explorer');
    
    // Check for common elements (adjust based on your actual DagRunExplorer component)
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should navigate to Log Browser page', async ({ page }) => {
    // Click the Log Browser link
    await page.click('a[href="/logs-browser"]');
    
    // Verify we're on the Log Browser page
    await expect(page).toHaveURL('/logs-browser');
    
    // Check for Log Browser specific elements
    await expect(page.locator('h1')).toContainText('🗂️ Airflow Log Browser');
    await expect(page.locator('h2')).toContainText('Log Viewer');
  });

  test('should have all navigation links visible', async ({ page }) => {
    // Check that all navigation links are present and visible
    const navLinks = [
      { href: '/', text: 'Add Task' },
      { href: '/tasks', text: 'Task List' },
      { href: '/all-dags', text: 'All DAGs' },
      { href: '/logs', text: 'Task Logs' },
      { href: '/explorer', text: 'Explore DAG Runs' },
      { href: '/logs-browser', text: 'Log Browser' },
    ];

    for (const link of navLinks) {
      const linkElement = page.locator(`a[href="${link.href}"]`);
      await expect(linkElement).toBeVisible();
      await expect(linkElement).toContainText(link.text);
    }
  });

  test('should maintain navigation state after page refresh', async ({ page }) => {
    // Navigate to a specific page
    await page.goto('/logs-browser');
    
    // Refresh the page
    await page.reload();
    
    // Verify we're still on the same page
    await expect(page).toHaveURL('/logs-browser');
    await expect(page.locator('h1')).toContainText('🗂️ Airflow Log Browser');
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Test direct navigation to each page
    const pages = [
      { url: '/', title: '🚀 Trigger Airflow DAG' },
      { url: '/tasks', title: 'DAG Runs for:' },
      { url: '/all-dags', title: 'All DAGs' },
      { url: '/logs', title: 'Task Logs' },
      { url: '/explorer', title: 'DAG Run Explorer' },
      { url: '/logs-browser', title: '🗂️ Airflow Log Browser' },
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await expect(page.locator('h1, h2')).toContainText(pageInfo.title);
    }
  });
}); 