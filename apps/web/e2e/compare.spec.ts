import { expect, test } from '@playwright/test';
import { stubApi } from './fixtures';

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test('adding two bikes fills the tray and opens a shareable comparison', async ({ page }) => {
  await page.goto('/');

  const tray = page.getByRole('region', { name: 'Compare tray' });
  await expect(tray).toBeHidden();

  await page.locator('article').filter({ hasText: 'CB650R' })
    .getByRole('button', { name: 'Add to compare' }).click();
  await expect(tray).toBeVisible();
  // One bike is not a comparison.
  await expect(tray.getByRole('button', { name: /Compare 1 bike/ })).toBeDisabled();

  await page.locator('article').filter({ hasText: 'UC3' })
    .getByRole('button', { name: 'Add to compare' }).click();

  await tray.getByRole('link', { name: /Compare 2 bikes/ }).click();
  await expect(page).toHaveURL(/\/compare\?ids=/);
  await expect(page.getByRole('table')).toBeVisible();
});

test('the winning figure in each row is the only one marked red', async ({ page }) => {
  await page.goto('/compare?ids=1,2');
  await expect(page.getByRole('table')).toBeVisible();

  const reds = await page.locator('td').evaluateAll(
    (cells) => cells.filter((c) => getComputedStyle(c).color === 'rgb(200, 16, 46)').length,
  );
  expect(reds).toBeGreaterThan(0);
  await expect(page.getByText('Red marks the best figure in each row')).toBeVisible();
});

test('a comparison states how old its figures are', async ({ page }) => {
  await page.goto('/compare?ids=1,2');
  await expect(page.getByRole('rowheader', { name: 'Specs as of' })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Caveats' })).toBeVisible();
});

test('one bike is not enough to compare, and the page says what to do', async ({ page }) => {
  await page.goto('/compare?ids=1');
  await expect(page.getByText('Pick two bikes to compare')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse all bikes' })).toBeVisible();
});
