import { test, expect } from '@playwright/test';

test.describe('Maid Registration - Performance & Load Testing', () => {
  test.describe('Performance Benchmarks', () => {
    test('registration page meets Web Vitals standards', async ({ page }) => {
      // Start navigation timing
      await page.goto('/register');

      // Measure Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Largest Contentful Paint (LCP)
          let lcp = 0;
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              lcp = entries[entries.length - 1].startTime;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID) - simulate
          let fid = 0;
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry) => {
              if (entry.name === 'first-input') {
                fid = entry.processingStart - entry.startTime;
              }
            });
          }).observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift (CLS)
          let cls = 0;
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry) => {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            });
          }).observe({ entryTypes: ['layout-shift'] });

          // Wait for measurements to settle
          setTimeout(() => {
            resolve({ lcp, fid, cls });
          }, 3000);
        });
      });

      console.log('Web Vitals:', webVitals);

      // Web Vitals thresholds (good performance)
      expect(webVitals.lcp).toBeLessThan(2500); // LCP should be < 2.5s
      expect(webVitals.fid).toBeLessThan(100);  // FID should be < 100ms
      expect(webVitals.cls).toBeLessThan(0.1);  // CLS should be < 0.1
    });

    test('form interactions are responsive under load', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Measure form field response times
      const fieldTests = [
        { name: 'name', value: 'Performance Test Maid' },
        { name: 'email', value: 'perf@example.com' },
        { name: 'password', value: 'Password123!' },
        { name: 'confirmPassword', value: 'Password123!' },
        { name: 'phone', value: '+251911234567' }
      ];

      const responseTimes = [];

      for (const field of fieldTests) {
        const startTime = Date.now();
        await page.fill(`[name="${field.name}"]`, field.value);
        await page.waitForFunction(() => true, null, { timeout: 1000 });
        const endTime = Date.now();

        const responseTime = endTime - startTime;
        responseTimes.push({ field: field.name, time: responseTime });

        console.log(`${field.name} field response time: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(200); // Each field should respond within 200ms
      }

      const avgResponseTime = responseTimes.reduce((sum, item) => sum + item.time, 0) / responseTimes.length;
      console.log(`Average field response time: ${avgResponseTime}ms`);
      expect(avgResponseTime).toBeLessThan(100); // Average should be under 100ms
    });

    test('country dropdown loads within performance budget', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const startTime = Date.now();

      // Click country dropdown
      await page.click('[name="country"]');

      // Wait for options to be visible
      await expect(page.locator('[name="country"] option').nth(5)).toBeVisible();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      console.log(`Country dropdown load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(500); // Should load countries within 500ms
    });

    test('phone verification flow performance', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Performance Test');
      await page.fill('[name="email"]', 'perf-phone@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Measure phone verification flow
      const verificationStartTime = Date.now();

      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();

      const codeInputTime = Date.now();

      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');
      await expect(page.locator('text=verified successfully')).toBeVisible();

      const verificationEndTime = Date.now();

      const totalVerificationTime = verificationEndTime - verificationStartTime;
      const codeInputLoadTime = codeInputTime - verificationStartTime;

      console.log(`Phone verification UI load time: ${codeInputLoadTime}ms`);
      console.log(`Total verification flow time: ${totalVerificationTime}ms`);

      expect(codeInputLoadTime).toBeLessThan(1000); // UI should appear within 1s
      expect(totalVerificationTime).toBeLessThan(3000); // Total flow under 3s
    });
  });

  test.describe('Memory & Resource Usage', () => {
    test('registration flow memory usage stays within bounds', async ({ page }) => {
      await page.goto('/register');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null;
      });

      if (initialMemory) {
        console.log('Initial memory usage:', initialMemory);
      }

      // Complete registration flow
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');
      await page.fill('[name="name"]', 'Memory Test Maid');
      await page.fill('[name="email"]', 'memory@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      await page.click('button:has-text("Send Verification Code")');
      await page.fill('input[placeholder*="6-digit"]', '123456');
      await page.click('button:has-text("Verify Code")');

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        console.log('Memory increase:', memoryIncrease, 'bytes');
        console.log('Final memory usage:', finalMemory);

        // Memory increase should be reasonable (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('no memory leaks during repeated interactions', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const getMemoryUsage = async () => {
        return await page.evaluate(() => {
          return performance.memory ? performance.memory.usedJSHeapSize : 0;
        });
      };

      const initialMemory = await getMemoryUsage();

      // Perform repeated interactions
      for (let i = 0; i < 10; i++) {
        await page.fill('[name="name"]', `Test Maid ${i}`);
        await page.fill('[name="email"]', `test${i}@example.com`);
        await page.fill('[name="password"]', `Password${i}!`);
        await page.fill('[name="confirmPassword"]', `Password${i}!`);

        // Clear and refill
        await page.fill('[name="name"]', '');
        await page.fill('[name="email"]', '');
        await page.fill('[name="password"]', '');
        await page.fill('[name="confirmPassword"]', '');
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      const finalMemory = await getMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        console.log(`Memory usage after repeated interactions: ${memoryIncrease} bytes increase`);

        // Memory increase should be minimal (less than 5MB)
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('handles concurrent requests efficiently', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      // Monitor network requests
      const requests = [];
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      });

      await page.fill('[name="name"]', 'Concurrent Test');
      await page.fill('[name="email"]', 'concurrent@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      const requestStartTime = Date.now();
      await page.click('button:has-text("Send Verification Code")');
      await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
      const requestEndTime = Date.now();

      const totalRequestTime = requestEndTime - requestStartTime;
      console.log(`Total request time: ${totalRequestTime}ms`);
      console.log(`Number of requests made: ${requests.length}`);

      expect(totalRequestTime).toBeLessThan(2000); // Should complete within 2s

      // Check for duplicate or unnecessary requests
      const apiRequests = requests.filter(req => req.url.includes('api') || req.url.includes('auth'));
      console.log('API requests:', apiRequests);
    });

    test('efficient bundle loading', async ({ page }) => {
      // Monitor resource loading
      const resources = [];
      page.on('response', response => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          resources.push({
            url: response.url(),
            size: response.headers()['content-length'],
            status: response.status(),
            timing: response.timing()
          });
        }
      });

      await page.goto('/register');

      // Wait for all resources to load
      await page.waitForLoadState('networkidle');

      const totalSize = resources.reduce((sum, resource) => {
        return sum + (parseInt(resource.size) || 0);
      }, 0);

      const jsResources = resources.filter(r => r.url.includes('.js'));
      const cssResources = resources.filter(r => r.url.includes('.css'));

      console.log(`Total resources loaded: ${resources.length}`);
      console.log(`JavaScript files: ${jsResources.length}`);
      console.log(`CSS files: ${cssResources.length}`);
      console.log(`Total size: ${totalSize} bytes`);

      // Bundle size should be reasonable
      expect(totalSize).toBeLessThan(2 * 1024 * 1024); // Less than 2MB total
    });
  });

  test.describe('Stress Testing', () => {
    test('form handles rapid input changes', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const nameField = page.locator('[name="name"]');

      // Rapidly type and clear field
      for (let i = 0; i < 50; i++) {
        await nameField.fill(`Rapid Test ${i}`);
        await page.waitForTimeout(10); // Small delay
        await nameField.fill('');
      }

      // Final fill should work correctly
      await nameField.fill('Final Test Name');
      await expect(nameField).toHaveValue('Final Test Name');
    });

    test('handles multiple form submissions gracefully', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      await page.fill('[name="name"]', 'Multi Submit Test');
      await page.fill('[name="email"]', 'multisubmit@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.fill('[name="confirmPassword"]', 'Password123!');
      await page.fill('[name="phone"]', '+251911234567');
      await page.selectOption('[name="country"]', 'Ethiopia');

      // Try multiple rapid submissions
      const submitButton = page.locator('button:has-text("Send Verification Code")');

      // Click rapidly multiple times
      for (let i = 0; i < 5; i++) {
        await submitButton.click();
        await page.waitForTimeout(100);
      }

      // Should handle gracefully and show appropriate state
      const isLoading = await page.locator('text=Sending').isVisible();
      const isVerificationVisible = await page.locator('input[placeholder*="6-digit"]').isVisible();

      expect(isLoading || isVerificationVisible).toBe(true);
    });
  });

  test.describe('Device Performance', () => {
    test('mobile device performance', async ({ page }) => {
      // Simulate mobile device
      await page.setViewportSize({ width: 375, height: 667 });

      // Throttle CPU to simulate lower-end device
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

      const startTime = Date.now();
      await page.goto('/register');
      await expect(page.locator('h1')).toBeVisible();
      const loadTime = Date.now() - startTime;

      console.log(`Mobile load time with CPU throttling: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // Should load within 5s on slow mobile

      // Test form interactions on mobile
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');

      const formStartTime = Date.now();
      await page.fill('[name="name"]', 'Mobile Test');
      await page.fill('[name="email"]', 'mobile@example.com');
      const formEndTime = Date.now();

      console.log(`Mobile form interaction time: ${formEndTime - formStartTime}ms`);
      expect(formEndTime - formStartTime).toBeLessThan(2000);

      // Reset CPU throttling
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    });

    test('low-end device simulation', async ({ page }) => {
      // Simulate very slow network and device
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024, // 50 KB/s
        uploadThroughput: 20 * 1024,   // 20 KB/s
        latency: 500 // 500ms latency
      });

      await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

      const startTime = Date.now();
      await page.goto('/register', { timeout: 30000 });
      await expect(page.locator('h1')).toBeVisible();
      const loadTime = Date.now() - startTime;

      console.log(`Low-end device simulation load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(15000); // Should still be usable within 15s

      // Test that basic functionality works
      await page.click('[data-testid="user-type-maid"], .group:has(text("Domestic Worker"))');
      await page.fill('[name="name"]', 'Low End Test');
      await expect(page.locator('[name="name"]')).toHaveValue('Low End Test');
    });
  });
});