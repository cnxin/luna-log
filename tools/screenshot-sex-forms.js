const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  await page.mouse.click(348, 771);
  await page.waitForTimeout(400);
  await page.getByText('做爱记录').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'partnered-sex-form-preview.png', fullPage: true });
  await page.mouse.wheel(0, 720);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'partnered-sex-form-detail-preview.png', fullPage: true });
  await page.getByText('只保存在本地').press('Escape').catch(() => {});
  await page.mouse.click(386, 229);
  await page.waitForTimeout(400);

  await page.mouse.click(348, 771);
  await page.waitForTimeout(400);
  await page.getByText('自慰记录').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'solo-sex-form-preview.png', fullPage: true });
  await page.mouse.wheel(0, 620);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'solo-sex-form-detail-preview.png', fullPage: true });

  await browser.close();
})();
