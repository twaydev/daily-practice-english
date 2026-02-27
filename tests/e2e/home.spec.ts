import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
	test('loads and displays page title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/English Practice/);
	});

	test('shows main heading', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: /Daily English Practice/i })).toBeVisible();
	});

	test('displays navigation links', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /Home/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Practice/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Favorites/i })).toBeVisible();
	});

	test('shows Sentences and Phrasal Verbs tabs', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('tab', { name: /Sentences/i })).toBeVisible();
		await expect(page.getByRole('tab', { name: /Phrasal Verbs/i })).toBeVisible();
	});

	test('navigates to Practice page when Practice nav link clicked', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /^Practice$/i }).first().click();
		await expect(page).toHaveURL(/\/practice/);
	});
});
