import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    dbPool?: {
      activeConnections: number;
      idleConnections: number;
      totalConnections: number;
    };
    wsClient?: {
      send: (data: string) => void;
      messageQueue?: any[];
      processedCount?: number;
    };
  }
}

test.describe('Performance and Load Testing', () => {
  test('should handle rapid ticket scanning under load', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // Generate 50 test tickets
    const tickets = Array.from({ length: 50 }, (_, i) => ({
      id: `TICKET${i + 1}`,
      plateNumber: `ABC${i + 1}`,
      amount: 5000
    }));
    
    const startTime = Date.now();
    
    // Process all tickets rapidly
    for (const ticket of tickets) {
      await page.fill('#ticket-input', ticket.id);
      await page.click('#scan-button');
      await page.click('#complete-button');
      await page.fill('#payment-amount', ticket.amount.toString());
      await page.click('#process-payment');
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Verify performance metrics
    expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    expect(await page.locator('#processed-count').textContent()).toBe('50');
  });

  test('should maintain UI responsiveness under load', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // Start performance monitoring
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    // Generate load
    const tickets = Array.from({ length: 20 }, (_, i) => `TICKET${i + 1}`);
    const operations = tickets.map(async (id) => {
      await page.fill('#ticket-input', id);
      await page.click('#scan-button');
    });
    
    await Promise.all(operations);
    
    // Get performance metrics
    const metrics = await client.send('Performance.getMetrics');
    const jsHeapSize = metrics.metrics.find((m: { name: string }) => m.name === 'JSHeapUsedSize')?.value || 0;
    
    // Verify memory usage
    expect(jsHeapSize).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
  });

  test('should handle database connection pool under load', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // Simulate multiple concurrent database operations
    const operations = Array.from({ length: 10 }, async () => {
      await page.fill('#ticket-input', '123456');
      await page.click('#scan-button');
      await page.click('#complete-button');
    });
    
    // Execute operations concurrently
    await Promise.all(operations);
    
    // Verify database connection pool metrics
    const poolMetrics = await page.evaluate(() => {
      return {
        activeConnections: window.dbPool?.activeConnections || 0,
        idleConnections: window.dbPool?.idleConnections || 0,
        totalConnections: window.dbPool?.totalConnections || 0
      };
    });
    
    expect(poolMetrics.activeConnections).toBeLessThan(20); // Max 20 active connections
    expect(poolMetrics.totalConnections).toBeLessThan(50); // Max 50 total connections
  });

  test('should handle WebSocket message queue under load', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // Generate 100 test messages
    const messages = Array.from({ length: 100 }, (_, i) => ({
      type: 'ticketUpdate',
      data: { id: `TICKET${i + 1}`, status: 'completed' }
    }));
    
    // Send messages rapidly
    const startTime = Date.now();
    for (const msg of messages) {
      await page.evaluate((message: any) => {
        window.wsClient?.send(JSON.stringify(message));
      }, msg);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Verify message processing time
    expect(totalTime).toBeLessThan(5000); // Should process within 5 seconds
    
    // Verify message queue metrics
    const queueMetrics = await page.evaluate(() => {
      return {
        queueSize: window.wsClient?.messageQueue?.length || 0,
        processedCount: window.wsClient?.processedCount || 0
      };
    });
    
    expect(queueMetrics.queueSize).toBe(0); // Queue should be empty
    expect(queueMetrics.processedCount).toBe(100); // All messages processed
  });

  test('should handle UI updates efficiently', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // Monitor frame rate
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    // Generate UI updates
    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        document.querySelector('#status-indicator')?.classList.toggle('active');
      });
    }
    
    // Get frame rate metrics
    const metrics = await client.send('Performance.getMetrics');
    const frameRate = metrics.metrics.find((m: { name: string }) => m.name === 'FrameRate')?.value || 0;
    
    // Verify frame rate
    expect(frameRate).toBeGreaterThan(30); // Should maintain at least 30 FPS
  });
}); 