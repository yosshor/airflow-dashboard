const { test, expect } = require('@playwright/test');

/**
 * Log Browser Tests for Airflow Dashboard
 * 
 * Tests the log browsing functionality, tree navigation, log viewing, and downloading.
 */
test.describe('Log Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Log Browser page before each test
    await page.goto('/logs-browser');
  });

  test('should display the Log Browser page correctly', async ({ page }) => {
    // Check the main heading
    await expect(page.locator('h1')).toContainText('🗂️ Airflow Log Browser');
    
    // Check the subtitle
    await expect(page.locator('p')).toContainText('Browse, view, and download Airflow task logs');
    
    // Check for the log viewer section
    await expect(page.locator('h2')).toContainText('Log Viewer');
  });

  test('should show loading state when fetching log tree', async ({ page }) => {
    // Mock a slow API response to see loading state
    await page.route('**/api/v1/dags', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dags: [] })
      });
    });

    // Reload the page to trigger the loading state
    await page.reload();
    
    // Check for loading text
    await expect(page.locator('div')).toContainText('Loading log tree...');
  });

  test('should display log tree when data is loaded', async ({ page }) => {
    // Mock successful API responses
    await page.route('**/api/v1/dags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dags: [
            { dag_id: 'example_task_group' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/example_task_group/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dag_runs: [
            { dag_run_id: 'scheduled__2025-07-13T00:00:00+00:00' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/example_task_group/dagRuns/scheduled__2025-07-13T00:00:00+00:00/taskInstances', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_instances: [
            { task_id: 'section_1.task_2', try_number: 1 }
          ]
        })
      });
    });

    // Reload the page to trigger the API calls
    await page.reload();
    
    // Wait for the tree to load
    await page.waitForSelector('span:has-text("example_task_group")');
    
    // Check that the DAG is displayed
    await expect(page.locator('span')).toContainText('example_task_group');
  });

  test('should expand and collapse tree nodes', async ({ page }) => {
    // Mock API responses with test data
    await page.route('**/api/v1/dags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dags: [
            { dag_id: 'test_dag' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dag_runs: [
            { dag_run_id: 'test_run' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_instances: [
            { task_id: 'test_task', try_number: 1 }
          ]
        })
      });
    });

    // Reload the page
    await page.reload();
    
    // Wait for the tree to load
    await page.waitForSelector('span:has-text("test_dag")');
    
    // Click on the DAG name to expand it
    await page.click('span:has-text("test_dag")');
    
    // Check that the run is now visible
    await expect(page.locator('span')).toContainText('test_run');
    
    // Click on the run name to expand it
    await page.click('span:has-text("test_run")');
    
    // Check that the task is now visible
    await expect(page.locator('span')).toContainText('test_task');
    
    // Click on the task name to expand it
    await page.click('span:has-text("test_task")');
    
    // Check that the log file is now visible
    await expect(page.locator('span')).toContainText('attempt=1.log');
  });

  test('should display log content when a log file is selected', async ({ page }) => {
    // Mock the log tree API
    await page.route('**/api/v1/dags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dags: [
            { dag_id: 'test_dag' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dag_runs: [
            { dag_run_id: 'test_run' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_instances: [
            { task_id: 'test_task', try_number: 1 }
          ]
        })
      });
    });

    // Mock the log content API
    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances/test_task/logs/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'This is test log content\nLine 2 of the log\nLine 3 of the log'
        })
      });
    });

    // Reload the page
    await page.reload();
    
    // Wait for the tree to load and expand it
    await page.waitForSelector('span:has-text("test_dag")');
    await page.click('span:has-text("test_dag")');
    await page.click('span:has-text("test_run")');
    await page.click('span:has-text("test_task")');
    
    // Click on the log file
    await page.click('span:has-text("attempt=1.log")');
    
    // Check that the log content is displayed
    await expect(page.locator('pre')).toContainText('This is test log content');
    await expect(page.locator('pre')).toContainText('Line 2 of the log');
    await expect(page.locator('pre')).toContainText('Line 3 of the log');
  });

  test('should show loading state when fetching log content', async ({ page }) => {
    // Mock the log tree API
    await page.route('**/api/v1/dags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dags: [
            { dag_id: 'test_dag' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dag_runs: [
            { dag_run_id: 'test_run' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_instances: [
            { task_id: 'test_task', try_number: 1 }
          ]
        })
      });
    });

    // Mock a slow log content API response
    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances/test_task/logs/1', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'Test log content'
        })
      });
    });

    // Reload the page
    await page.reload();
    
    // Wait for the tree to load and expand it
    await page.waitForSelector('span:has-text("test_dag")');
    await page.click('span:has-text("test_dag")');
    await page.click('span:has-text("test_run")');
    await page.click('span:has-text("test_task")');
    
    // Click on the log file
    await page.click('span:has-text("attempt=1.log")');
    
    // Check that loading state is shown
    await expect(page.locator('div')).toContainText('Loading log...');
  });

  test('should handle log content API errors', async ({ page }) => {
    // Mock the log tree API
    await page.route('**/api/v1/dags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dags: [
            { dag_id: 'test_dag' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dag_runs: [
            { dag_run_id: 'test_run' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_instances: [
            { task_id: 'test_task', try_number: 1 }
          ]
        })
      });
    });

    // Mock an error response for log content
    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances/test_task/logs/1', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Log not found',
          status: 404
        })
      });
    });

    // Reload the page
    await page.reload();
    
    // Wait for the tree to load and expand it
    await page.waitForSelector('span:has-text("test_dag")');
    await page.click('span:has-text("test_dag")');
    await page.click('span:has-text("test_run")');
    await page.click('span:has-text("test_task")');
    
    // Click on the log file
    await page.click('span:has-text("attempt=1.log")');
    
    // Check that error message is shown
    await expect(page.locator('div')).toContainText('Error: Failed to fetch log file');
  });

  test('should show download button when a log is selected', async ({ page }) => {
    // Mock the log tree API
    await page.route('**/api/v1/dags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dags: [
            { dag_id: 'test_dag' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dag_runs: [
            { dag_run_id: 'test_run' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_instances: [
            { task_id: 'test_task', try_number: 1 }
          ]
        })
      });
    });

    // Mock the log content API
    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances/test_task/logs/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'Test log content'
        })
      });
    });

    // Reload the page
    await page.reload();
    
    // Wait for the tree to load and expand it
    await page.waitForSelector('span:has-text("test_dag")');
    await page.click('span:has-text("test_dag")');
    await page.click('span:has-text("test_run")');
    await page.click('span:has-text("test_task")');
    
    // Click on the log file
    await page.click('span:has-text("attempt=1.log")');
    
    // Check that the download button is visible
    await expect(page.locator('button')).toContainText('Download');
  });

  test('should show empty viewer message when no log is selected', async ({ page }) => {
    // Check that the empty viewer message is displayed
    await expect(page.locator('div')).toContainText('Select a log file to view its contents.');
  });

  test('should display log path information when a log is selected', async ({ page }) => {
    // Mock the log tree API
    await page.route('**/api/v1/dags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dags: [
            { dag_id: 'test_dag' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dag_runs: [
            { dag_run_id: 'test_run' }
          ]
        })
      });
    });

    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_instances: [
            { task_id: 'test_task', try_number: 1 }
          ]
        })
      });
    });

    // Mock the log content API
    await page.route('**/api/v1/dags/test_dag/dagRuns/test_run/taskInstances/test_task/logs/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'Test log content'
        })
      });
    });

    // Reload the page
    await page.reload();
    
    // Wait for the tree to load and expand it
    await page.waitForSelector('span:has-text("test_dag")');
    await page.click('span:has-text("test_dag")');
    await page.click('span:has-text("test_run")');
    await page.click('span:has-text("test_task")');
    
    // Click on the log file
    await page.click('span:has-text("attempt=1.log")');
    
    // Check that the log path information is displayed
    await expect(page.locator('span')).toContainText('DAG: test_dag | Run: test_run | Task: test_task | Attempt: 1');
  });
}); 