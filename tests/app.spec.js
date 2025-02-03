const { test, expect } = require('@playwright/test');

// URL приложения
const BASE_URL = 'http://localhost:3000';

test.describe('DApp Interface Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Logs can handle many entries', async ({ page }) => {
    const logSection = await page.locator('section:has-text("Action Logs")');
    
    // Симулируем 1000 записей в логах
    for (let i = 0; i < 1000; i++) {
      await page.evaluate((i) => {
        const logEntry = `${new Date().toLocaleTimeString()} - Log entry ${i}`;
        const logs = document.querySelector('ul');
        if (logs) {
          const li = document.createElement('li');
          li.textContent = logEntry;
          logs.appendChild(li);
        }
      }, i);
    }

    // Проверяем, что все записи видны
    const logCount = await logSection.locator('ul li').count();
    expect(logCount).toBeGreaterThanOrEqual(1000);

    // Проверяем скроллинг
    const isScrollable = await logSection.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(isScrollable).toBeTruthy();
  });

  test('Token balances display correctly for multiple wallets', async ({ page }) => {
    // Предполагаем, что есть кнопка для вызова функции getAllTokenBalances
    const button = page.locator('button:has-text("Get Balances")');
    await button.click();

    // Проверяем, что логи заполнились балансами
    const logSection = await page.locator('section:has-text("Action Logs") ul');
    const logCount = await logSection.locator('li').count();

    // Ожидаем, что хотя бы один баланс отображается
    expect(logCount).toBeGreaterThan(0);

    // Проверяем формат записи
    const logText = await logSection.locator('li').first().textContent();
    expect(logText).toMatch(/Balance for wallet/);
  });

  test('Duration of operations is logged', async ({ page }) => {
    // Нажимаем на кнопку для запуска операции (например, Mint Tokens)
    const button = page.locator('button:has-text("Mint Tokens")');
    await button.click();

    // Проверяем, что логи содержат информацию о времени выполнения
    const logSection = await page.locator('section:has-text("Action Logs") ul');
    const logText = await logSection.locator('li').first().textContent();
    expect(logText).toMatch(/Duration: \d+ms/);
  });

  test('Handles errors gracefully', async ({ page }) => {
    // Предполагаем, что некорректный адрес вызовет ошибку
    await page.fill('input[name="recipient"]', 'invalid_address');
    await page.fill('input[name="amount"]', '10');

    // Отправляем форму перевода токенов
    await page.click('button:has-text("Transfer Tokens")');

    // Проверяем, что отображено сообщение об ошибке
    const toastMessage = await page.locator('.Toastify__toast--error').textContent();
    expect(toastMessage).toMatch(/Error transferring tokens/);
  });

  test('Performance test for multiple operations', async ({ page }) => {
    const start = Date.now();

    // Запускаем множество операций подряд
    for (let i = 0; i < 100; i++) {
      const button = page.locator('button:has-text("Mint Tokens")');
      await button.click();
    }

    const duration = Date.now() - start;

    // Проверяем, что операции выполняются в разумные сроки
    expect(duration).toBeLessThan(10000); // Например, все операции должны уложиться в 10 секунд
  });
});
