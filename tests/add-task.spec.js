const { test, expect } = require('@playwright/test');

/**
 * Add Task Tests for Airflow Dashboard
 * 
 * Tests the DAG triggering functionality, form validation, and API interactions.
 */
test.describe('Add Task Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Add Task page before each test
    await page.goto('/');
  });

  test('should display the Add Task form correctly', async ({ page }) => {
    // Check the main heading
    await expect(page.locator('h1')).toContainText('🚀 Trigger Airflow DAG');
    
    // Check the subtitle
    await expect(page.locator('p')).toContainText('Execute your Airflow DAGs with custom parameters');
    
    // Verify form elements are present
    await expect(page.locator('input[id="dagId"]')).toBeVisible();
    await expect(page.locator('input[id="param1"]')).toBeVisible();
    await expect(page.locator('input[id="param2"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="button"]')).toContainText('🔄 Reset');
  });

  test('should have default values in form fields', async ({ page }) => {
    // Check default DAG ID
    await expect(page.locator('input[id="dagId"]')).toHaveValue('test_hello_world');
    
    // Check that parameter fields are empty
    await expect(page.locator('input[id="param1"]')).toHaveValue('');
    await expect(page.locator('input[id="param2"]')).toHaveValue('');
  });

  test('should allow editing form fields', async ({ page }) => {
    // Edit the DAG ID
    await page.fill('input[id="dagId"]', 'my_custom_dag');
    await expect(page.locator('input[id="dagId"]')).toHaveValue('my_custom_dag');
    
    // Edit parameter 1
    await page.fill('input[id="param1"]', 'test_param_1');
    await expect(page.locator('input[id="param1"]')).toHaveValue('test_param_1');
    
    // Edit parameter 2
    await page.fill('input[id="param2"]', 'test_param_2');
    await expect(page.locator('input[id="param2"]')).toHaveValue('test_param_2');
  });

  test('should validate required fields', async ({ page }) => {
    // Clear the DAG ID field
    await page.fill('input[id="dagId"]', '');
    
    // Try to submit the form
    await page.click('button[type="submit"]');
    
    // Check that an error message appears
    await expect(page.locator('div')).toContainText('Error: DAG ID is required');
  });

  test('should reset form when reset button is clicked', async ({ page }) => {
    // Fill in some values
    await page.fill('input[id="dagId"]', 'my_custom_dag');
    await page.fill('input[id="param1"]', 'test_param_1');
    await page.fill('input[id="param2"]', 'test_param_2');
    
    // Click the reset button
    await page.click('button[type="button"]');
    
    // Check that form is reset to default values
    await expect(page.locator('input[id="dagId"]')).toHaveValue('test_hello_world');
    await expect(page.locator('input[id="param1"]')).toHaveValue('');
    await expect(page.locator('input[id="param2"]')).toHaveValue('');
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Mock the API call to simulate a slow response
    await page.route('**/api/v1/dags/*/dagRuns', async route => {
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dag_run_id: 'test_run_123' })
      });
    });

    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check that the button shows loading state
    await expect(page.locator('button[type="submit"]')).toContainText('⏳ Triggering...');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should handle successful DAG trigger', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/v1/dags/*/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dag_run_id: 'test_run_123' })
      });
    });

    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for success message
    await expect(page.locator('div')).toContainText('✅ Success: DAG triggered with ID test_run_123');
    
    // Check that parameter fields are cleared on success
    await expect(page.locator('input[id="param1"]')).toHaveValue('');
    await expect(page.locator('input[id="param2"]')).toHaveValue('');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/v1/dags/*/dagRuns', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ 
          title: 'DAG not found',
          status: 404,
          type: 'https://airflow.apache.org/docs/apache-airflow/2.9.1/stable-rest-api-ref.html#section/Errors/NotFound'
        })
      });
    });

    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('div')).toContainText('❌ Error: DAG not found');
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network error
    await page.route('**/api/v1/dags/*/dagRuns', async route => {
      await route.abort();
    });

    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('div')).toContainText('❌ Error: Failed to trigger DAG');
  });

  test('should include parameters in API call when provided', async ({ page }) => {
    let requestBody = null;
    
    // Intercept the API call to check the request body
    await page.route('**/api/v1/dags/*/dagRuns', async route => {
      requestBody = JSON.parse(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dag_run_id: 'test_run_123' })
      });
    });

    // Fill in parameters
    await page.fill('input[id="param1"]', 'test_param_1');
    await page.fill('input[id="param2"]', 'test_param_2');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check that the request body includes the parameters
    expect(requestBody).toEqual({
      conf: {
        param1: 'test_param_1',
        param2: 'test_param_2'
      }
    });
  });

  test('should not include empty parameters in API call', async ({ page }) => {
    let requestBody = null;
    
    // Intercept the API call to check the request body
    await page.route('**/api/v1/dags/*/dagRuns', async route => {
      requestBody = JSON.parse(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dag_run_id: 'test_run_123' })
      });
    });

    // Leave parameters empty
    await page.fill('input[id="param1"]', '');
    await page.fill('input[id="param2"]', '');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check that the request body has empty conf object
    expect(requestBody).toEqual({ conf: {} });
  });

  test('should display help section', async ({ page }) => {
    // Check that help section is present
    await expect(page.locator('h3')).toContainText('💡 How to use:');
    
    // Check help list items
    const helpItems = [
      'Enter the DAG ID you want to trigger',
      'Add optional parameters if your DAG requires them',
      'Click "Trigger DAG" to execute',
      'Monitor the success/error message below'
    ];
    
    for (const item of helpItems) {
      await expect(page.locator('li')).toContainText(item);
    }
  });
}); 