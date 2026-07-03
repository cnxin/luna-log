const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // ---- SOLO form: 道具 + 心情 icons ----
  await page.mouse.click(348, 771);
  await page.waitForTimeout(400);
  await page.getByText('自慰记录').click();
  await page.waitForTimeout(600);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'verify-solo-icons.png', fullPage: true });
  await page.mouse.click(386, 229); // close X
  await page.waitForTimeout(300);

  // ---- PARTNERED form: 保护措施 + 姿势 + 心情 ----
  await page.mouse.click(348, 771);
  await page.waitForTimeout(400);
  await page.getByText('做爱记录').click();
  await page.waitForTimeout(600);
  await page.mouse.wheel(0, 780);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'verify-partnered-icons.png', fullPage: true });

  // ---- Duration picker (wheel + manual) ----
  await page.mouse.wheel(0, -560);
  await page.waitForTimeout(300);
  await page.getByText('点击选择').click().catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verify-duration-picker.png', fullPage: true });
  await page.getByText('完成').click().catch(() => {});
  await page.waitForTimeout(300);

  // ---- Timer full screen ----
  await page.getByText('用计时器记录').click();
  await page.waitForTimeout(500);
  await page.getByText('开始').click().catch(() => {});
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'verify-timer.png', fullPage: true });

  await browser.close();
})();


