const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const scroller = Array.from(document.querySelectorAll('*')).find((el) => el.scrollHeight > el.clientHeight + 40);
    if (scroller) scroller.scrollTop = 420;
  });
  await page.waitForTimeout(300);
  await page.getByText('月经开始', { exact: false }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'period-edit-preview.png', fullPage: true });
  await browser.close();
})();
