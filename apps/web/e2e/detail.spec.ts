import { expect, test } from '@playwright/test';
import { stubApi } from './fixtures';

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test('a spec sheet states its own age and source', async ({ page }) => {
  await page.goto('/bikes/honda-cb650r');

  await expect(page.getByRole('heading', { name: 'CB650R', level: 1 })).toBeVisible();
  await expect(page.getByText(/Specifications as recorded on 2026-09-04/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the spec source' })).toBeVisible();
});

test('a caveat is shown rather than hidden', async ({ page }) => {
  await page.goto('/bikes/honda-uc3');
  await expect(page.getByText(/Note on this data:/)).toBeVisible();
});

test('a missing bike explains itself and offers a way on', async ({ page }) => {
  await page.goto('/bikes/nope');
  await expect(page.getByText('We do not have that bike')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse all bikes' })).toBeVisible();
});

test('image credits are reachable from every page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Footer' })
    .getByRole('link', { name: 'Image credits' }).click();

  await expect(page).toHaveURL(/\/credits/);
  await expect(page.getByRole('heading', { name: 'Image credits' })).toBeVisible();
});
