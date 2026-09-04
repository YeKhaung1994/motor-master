import { expect, test } from '@playwright/test';
import { stubApi } from './fixtures';

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test('the catalogue renders and every nav link is reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('article')).toHaveCount(3);

  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'All bikes' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Brands' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Compare' })).toBeVisible();
});

test('an unpublished figure shows an em dash, never a zero', async ({ page }) => {
  await page.goto('/');
  const uc3 = page.locator('article').filter({ hasText: 'UC3' });

  await expect(uc3.getByText('—')).toHaveCount(3);
  await expect(uc3.getByText('0', { exact: true })).toHaveCount(0);
});

test('a model with a source caveat says so on the card', async ({ page }) => {
  await page.goto('/');
  const uc3 = page.locator('article').filter({ hasText: 'UC3' });

  await expect(uc3.getByText('Some figures provisional')).toBeVisible();
  // A model without a caveat must not be marked.
  await expect(
    page.locator('article').filter({ hasText: 'CB650R' }).getByText('Some figures provisional'),
  ).toHaveCount(0);
});

test('a model with no published price says so plainly', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('article').filter({ hasText: 'Primavera' }).getByText('Price not published'),
  ).toBeVisible();
});

test('the class filter only offers classes the brand actually has', async ({ page }) => {
  await page.goto('/');
  const filter = page.locator('fieldset').filter({ hasText: 'Class' }).first();
  await expect(filter.locator('label')).toHaveCount(3);

  await page.goto('/brands/vespa');
  await expect(page.locator('article')).toHaveCount(1);
  // Offering "Naked" on a scooter brand is offering a filter that returns nothing.
  await expect(filter.locator('label')).toHaveCount(1);
  await expect(filter.getByText('Scooter')).toBeVisible();
});

test('filtering by class narrows the grid and is shareable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('checkbox', { name: /Naked/ }).check();

  await expect(page).toHaveURL(/class=Naked/);
  await expect(page.locator('article')).toHaveCount(1);
});

test('the sidebar never becomes a second scroll container', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('article').first()).toBeVisible();

  const railScrolls = await page.locator('aside').evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      overflow: style.overflowY,
      scrolls: el.scrollHeight > el.clientHeight + 1,
    };
  });

  expect(railScrolls.scrolls).toBe(false);
  expect(['visible', 'clip']).toContain(railScrolls.overflow);
});
