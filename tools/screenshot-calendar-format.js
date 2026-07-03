const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  await page.mouse.click(175, 858);
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'calendar-format-preview.png', fullPage: true });

  await page.mouse.click(95, 858);
  await page.waitForTimeout(400);
  await page.mouse.click(348, 771);
  await page.waitForTimeout(400);
  await page.getByText('做爱记录').click();
  await page.waitForTimeout(500);
  await page.getByText('点击选择日期').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'date-picker-preview.png', fullPage: true });

  await browser.close();
})();
