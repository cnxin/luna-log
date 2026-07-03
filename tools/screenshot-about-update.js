const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.mouse.click(372, 72);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'about-update-preview.png', fullPage: true });
  await browser.close();
})();
