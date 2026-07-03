const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByText('统计', { exact: true }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'stats-preview.png', fullPage: true });
  await browser.close();
})();
