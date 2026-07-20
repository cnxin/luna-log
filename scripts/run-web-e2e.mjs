import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const projectRoot = process.cwd();
const port = process.env.E2E_PORT || '8094';
const baseUrl = 'http://127.0.0.1:' + port;
const viewport = {
  width: Number(process.env.E2E_VIEWPORT_WIDTH) || 430,
  height: Number(process.env.E2E_VIEWPORT_HEIGHT) || 932,
};

const labels = {
  addRecord: '\u6dfb\u52a0\u8bb0\u5f55',
  home: '\u9996\u9875',
  settings: '\u8bbe\u7f6e',
  mintTheme: '\u8584\u8377\u4e3b\u9898',
  partnered: '\u4f34\u4fa3\u4eb2\u5bc6',
  notes: '\u5907\u6ce8',
  save: '\u4fdd\u5b58\u8bb0\u5f55',
  filterPrefix: '\u7b5b\u9009\uff1a',
  keyword: '\u5173\u952e\u8bcd',
  applyFilter: '\u5e94\u7528\u7b5b\u9009',
  resetFilter: '\u6062\u590d\u9ed8\u8ba4\u7b5b\u9009',
  searchActive: '\u641c\u7d22\u4e2d',
  noMatch: '\u6ca1\u6709\u627e\u5230\u5339\u914d\u8bb0\u5f55',
};

function resolveChromiumExecutable() {
  const bundled = chromium.executablePath();
  if (existsSync(bundled)) return bundled;
  if (process.platform !== 'win32') return undefined;

  const browserRoot = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(browserRoot)) return undefined;
  const candidates = readdirSync(browserRoot)
    .filter((name) => name.startsWith('chromium-'))
    .sort()
    .reverse();

  for (const candidate of candidates) {
    for (const relativePath of ['chrome-win/chrome.exe', 'chrome-win64/chrome.exe']) {
      const executable = join(browserRoot, candidate, relativePath);
      if (existsSync(executable)) return executable;
    }
  }
  return undefined;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForServer(server, getServerError) {
  let lastError;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Expo Web server exited before becoming ready: ' + getServerError());
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await delay(1000);
  }
  throw lastError || new Error('Expo Web server did not become ready');
}

async function runBrowserFlow(getServerError) {
  const executablePath = resolveChromiumExecutable();
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url() + ': ' + (request.failure()?.errorText || 'failed')));

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction((text) => document.body.innerText.includes(text), labels.addRecord);
    } catch (error) {
      const body = await page.locator('body').innerText().catch(() => '');
      throw new Error(
        error.message
          + '\nExpo stderr:\n' + getServerError()
          + '\nPage errors:\n' + pageErrors.join('\n')
          + '\nConsole errors:\n' + consoleErrors.join('\n')
          + '\nFailed requests:\n' + failedRequests.join('\n')
          + '\nPage body:\n' + body.slice(0, 2000),
      );
    }

    await page.getByLabel(labels.settings).click();
    const mintTheme = page.getByRole('radio', { name: labels.mintTheme });
    await mintTheme.click();
    await page.getByTestId('theme-option-mint-active').waitFor({ state: 'visible' });
    await page.getByLabel(labels.home).click();
    await page.waitForFunction((text) => document.body.innerText.includes(text), labels.addRecord);

    await page.getByLabel(labels.addRecord).first().click();
    await page.getByText(labels.partnered, { exact: true }).click();
    await page.getByLabel('关闭记录表单').waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    const sheetHandle = page.getByTestId('apple-sheet-handle');
    const handleBeforeDrag = await sheetHandle.boundingBox();
    assert.ok(handleBeforeDrag, 'Sheet drag handle is not visible');
    await page.mouse.move(handleBeforeDrag.x + handleBeforeDrag.width / 2, handleBeforeDrag.y + handleBeforeDrag.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBeforeDrag.x + handleBeforeDrag.width / 2, handleBeforeDrag.y - 40, { steps: 8 });
    const handleDuringDrag = await sheetHandle.boundingBox();
    await page.mouse.up();
    assert.ok(
      handleDuringDrag && handleDuringDrag.y < handleBeforeDrag.y - 2,
      'Upward drag did not activate the sheet gesture',
    );
    await page.getByText('未设置', { exact: true }).click();
    await page.getByText('手动输入', { exact: true }).waitFor({ state: 'visible' });
    await page.getByText('取消', { exact: true }).last().click();
    await page.getByLabel('更多亲密细节').click();
    await page.getByLabel('伴侣', { exact: true }).waitFor({ state: 'visible' });
    await page.getByLabel(labels.notes).fill('E2E note');
    await page.getByLabel(labels.save).click();
    await page.waitForTimeout(800);
    if (await page.getByLabel(labels.save).isVisible()) {
      throw new Error('Record save did not close the sheet: ' + (await page.locator('body').innerText()).slice(-1200));
    }

    const filterTrigger = page.locator('[aria-label^="' + labels.filterPrefix + '"]').first();
    await filterTrigger.waitFor({ state: 'visible' });
    await filterTrigger.click();
    await page.getByLabel(labels.keyword).fill('E2E note');
    await page.getByLabel(labels.applyFilter).click();
    await page.waitForFunction((text) => document.body.innerText.includes(text), labels.searchActive);
    assert.equal((await page.locator('body').innerText()).includes(labels.noMatch), false);

    await filterTrigger.click();
    await page.getByLabel(labels.keyword).fill('E2E-missing');
    await page.getByLabel(labels.applyFilter).click();
    await page.waitForFunction((text) => document.body.innerText.includes(text), labels.noMatch);

    await filterTrigger.click();
    await page.getByLabel(labels.resetFilter).click();
    await page.getByLabel(labels.applyFilter).click();
    await page.waitForFunction((text) => !document.body.innerText.includes(text), labels.searchActive);
    assert.equal((await page.locator('body').innerText()).includes(labels.noMatch), false);

    assert.equal(pageErrors.length, 0, pageErrors.join('\n'));
  } finally {
    await browser.close();
  }
}

async function main() {
  const expoCli = join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
  const server = spawn(process.execPath, [expoCli, 'start', '--web', '--port', port], {
    cwd: projectRoot,
    env: { ...process.env, CI: '1' },
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  });

  let serverError = '';
  server.stderr.on('data', (chunk) => {
    serverError += chunk.toString();
  });

  try {
    await waitForServer(server, () => serverError.trim());
    await runBrowserFlow(() => serverError.trim());
  } finally {
    server.kill();
  }
}

await main();
