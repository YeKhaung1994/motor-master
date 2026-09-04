import { expect, test } from '@playwright/test';
import { bikes, stubApi } from './fixtures';

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test('the catalogue renders and every nav link is reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('article').first()).toBeVisible();
  await expect(page.locator('article')).toHaveCount(bikes.length);

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
  const nakedCount = bikes.filter((b) => b.class === 'Naked').length;

  await page.getByRole('checkbox', { name: /Naked/ }).check();

  await expect(page).toHaveURL(/class=Naked/);
  await expect(page.locator('article')).toHaveCount(nakedCount);
  // The classes that were filtered out are genuinely gone.
  await expect(page.locator('article').filter({ hasText: 'Primavera' })).toHaveCount(0);
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

test('quick compare waits behind a launcher instead of holding the fold', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('article').first()).toBeVisible();

  // The panel is not on the page until it is asked for.
  await expect(page.getByRole('dialog')).toBeHidden();

  const launcher = page.getByRole('button', { name: /Quick compare/ });
  await expect(launcher).toHaveAttribute('aria-haspopup', 'dialog');
  await launcher.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'First bike' })).toBeVisible();
});

test('the quick compare dialog closes on escape and returns focus', async ({ page }) => {
  await page.goto('/');
  const launcher = page.getByRole('button', { name: /Quick compare/ });
  await launcher.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(launcher).toBeFocused();
});

test('picking two bikes in the dialog opens the comparison', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Quick compare/ }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'First bike' }).selectOption({ label: 'Honda CB650R' });
  await dialog.getByRole('combobox', { name: 'Second bike' }).selectOption({ label: 'Honda UC3' });
  await dialog.getByRole('button', { name: 'Compare these' }).click();

  await expect(page).toHaveURL(/\/compare\?ids=1,2/);
  await expect(page.getByRole('table')).toBeVisible();
});

test('the launcher lifts clear of the compare tray', async ({ page }) => {
  await page.goto('/');
  await page.locator('article').first().getByRole('button', { name: 'Add to compare' }).click();

  const launcher = page.getByRole('button', { name: /Quick compare/ });
  const tray = page.getByRole('region', { name: 'Compare tray' });
  await expect(tray).toBeVisible();

  const launcherBox = await launcher.boundingBox();
  const trayBox = await tray.boundingBox();
  expect(launcherBox!.y + launcherBox!.height).toBeLessThanOrEqual(trayBox!.y);
});

test('the launcher parks at the footer instead of covering the byline', async ({ page }) => {
  await page.goto('/');
  const launcher = page.locator('button', { hasText: 'Quick compare' });
  await expect(launcher).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // Parked means out of the tab order too, not merely out of sight.
  await expect(launcher).toBeHidden();
  await expect(page.getByRole('button', { name: /Quick compare/ })).toHaveCount(0);
  await expect(page.getByText('Built by YK')).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(launcher).toBeVisible();
});
