import { expect, test } from '@playwright/test';

test.describe('public site', () => {
  for (const [path, heading] of [
    ['/', 'Ride Hard. We’ll keep you rolling.'],
    ['/about', 'About Faction Bikeworks'],
    ['/media', 'Media Gallery'],
    ['/faq', 'FAQ'],
    ['/contact', 'Contact & Hours'],
  ]) {
    test(`${path} shows "${heading}"`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    });
  }

  test('old addresses redirect', async ({ page }) => {
    await page.goto('/gallery.html');
    await expect(page).toHaveURL(/\/media$/);
  });

  test('never requests the paid Google Maps JS API', async ({ page }) => {
    const bad: string[] = [];
    page.on('request', (r) => { if (r.url().includes('maps.googleapis.com/maps/api/js')) bad.push(r.url()); });
    for (const p of ['/', '/about', '/media', '/faq', '/contact']) await page.goto(p);
    expect(bad).toEqual([]);
  });

  test('quick message opens WhatsApp pre-filled', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __opened: string[] }).__opened = [];
      window.open = ((u: string) => { (window as unknown as { __opened: string[] }).__opened.push(u); return {} as Window; }) as typeof window.open;
    });
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Please enter your name.')).toBeVisible();
    await page.getByLabel('Name').fill('Aiman');
    await page.getByLabel('Message').fill('Fork service?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Opening WhatsApp…')).toBeVisible();
    const opened = await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
    expect(decodeURIComponent(opened[0]!)).toBe('https://wa.me/601133321767?text=New website enquiry\nName: Aiman\nMessage: Fork service?');
  });

  test('gallery lightbox opens, steps and closes with the keyboard', async ({ page }) => {
    await page.goto('/media');
    await page.getByRole('button', { name: /^Open/ }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Image viewer' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('1 / 9')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText('2 / 9')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('FAQ shows the shop hours from settings', async ({ page }) => {
    await page.goto('/faq');
    await page.getByRole('button', { name: 'What are your operating hours?' }).click();
    await expect(page.getByText('We’re open Mon–Fri · 11:00–19:30, Sat · 11:00–16:00, Sun · Closed.')).toBeVisible();
  });

  test('mobile menu navigates', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: /FAQ/ }).click();
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.getByRole('heading', { level: 1, name: 'FAQ' })).toBeVisible();
    await page.close();
  });
});
