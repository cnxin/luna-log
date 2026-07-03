const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // open partnered form
  await page.mouse.click(348, 771);
  await page.waitForTimeout(400);
  await page.getByText('做爱记录').click();
  await page.waitForTimeout(700);

  // --- Duration picker: click the value box ("未设置") ---
  await page.getByText('未设置').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'verify-duration-picker.png', fullPage: true });
  // pick 40 via wheel text then done
  await page.getByText('40 分', { exact: true }).click().catch(() => {});
  await page.waitForTimeout(300);
  await page.getByText('完成').click();
  await page.waitForTimeout(500);

  // --- Timer: launch, start, let it tick ---
  await page.getByText('用计时器记录').click();
  await page.waitForTimeout(900); // slide-in
  await page.getByText('开始', { exact: true }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verify-timer-running.png', fullPage: true });
  // finish -> should fill duration
  await page.getByText('完成', { exact: true }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'verify-duration-after-timer.png', fullPage: true });

  await browser.close();
})();
