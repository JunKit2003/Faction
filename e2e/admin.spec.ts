import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page, password = 'e2e-owner-password', expectOk = true) {
  await page.goto('/admin');
  await page.getByLabel('Email').fill('owner@faction.my');
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  if (expectOk) await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

test.describe('admin', () => {
  test('jump-to search finds the logo settings', async ({ page }) => {
    await signIn(page);
    await page.keyboard.press('Control+k');
    await page.getByLabel('Search the admin').fill('logo');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/admin\/shop\/branding$/);
    await expect(page.getByText('Logo for light backgrounds')).toBeVisible();
  });

  test('editing a service happens in a dialog and goes live', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/homepage/services');
    await page.getByRole('listitem', { name: 'Service 2' }).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Service 2' });
    await dialog.getByLabel('Title').fill('Suspension Lab');
    await dialog.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Suspension Lab' })).toBeVisible();
  });

  test('wrong password is refused', async ({ page }) => {
    await signIn(page, 'not-the-password', false);
    await expect(page.getByText('Email or password is incorrect.')).toBeVisible();
  });

  test('change hours → live on the site → audited → restore', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/shop/hours');
    await page.getByLabel('Sat opens').fill('10:00');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();

    for (const p of ['/about', '/contact']) {
      await page.goto(p);
      await expect(page.locator('main').getByText('Sat · 10:00–16:00')).toBeVisible();
    }

    await page.goto('/admin/activity');
    const entry = page.getByRole('button', { name: /owner@faction\.my Edited Site settings/ });
    await expect(entry).toBeVisible();
    await entry.click();
    await expect(page.locator('tr[data-changed="true"]', { hasText: 'Hours › Sat › Open' })).toContainText('10:00');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Restore this version (before)' }).click();
    await expect(page.getByText('Restored Site settings.')).toBeVisible();

    await page.goto('/about');
    await expect(page.locator('main').getByText('Sat · 11:00–16:00')).toBeVisible();
  });

  test('validation stops a bad map link', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/shop/map');
    await page.getByLabel('Google Maps embed link').fill('https://example.com/map');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Paste the embed link from Google Maps → Share → Embed a map.')).toBeVisible();
  });

  test('reorder FAQ goes live', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/sections/faq');
    await expect(page).toHaveURL(/\/admin\/pages\/faq$/);
    for (let i = 0; i < 3; i++) await page.getByRole('listitem', { name: `Question ${4 - i}` }).getByRole('button', { name: 'Move up' }).click();
    await expect(page.getByRole('listitem', { name: 'Question 1' })).toContainText('Do you service e-MTBs?');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
    await page.goto('/faq');
    await expect(page.locator('main li').first()).toContainText('Do you service e-MTBs?');
  });
});
