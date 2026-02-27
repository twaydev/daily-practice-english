import { test, expect } from '@playwright/test';

test.describe('Auth pages', () => {
	test.describe('Login page', () => {
		test('shows login form', async ({ page }) => {
			await page.goto('/auth/login');
			await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
			await expect(page.getByLabel(/Email/i)).toBeVisible();
			await expect(page.getByLabel(/^Password$/i)).toBeVisible();
			await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
		});

		test('shows link to sign up', async ({ page }) => {
			await page.goto('/auth/login');
			await expect(page.getByRole('link', { name: /Sign up/i })).toBeVisible();
		});

		test('navigates to signup when Sign up clicked', async ({ page }) => {
			await page.goto('/auth/login');
			await page.getByRole('link', { name: /Sign up/i }).click();
			await expect(page).toHaveURL(/\/auth\/signup/);
		});
	});

	test.describe('Sign up page', () => {
		test('shows sign up form', async ({ page }) => {
			await page.goto('/auth/signup');
			await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible();
			await expect(page.getByLabel(/Email/i)).toBeVisible();
			await expect(page.getByLabel(/^Password$/i)).toBeVisible();
			await expect(page.getByLabel(/Confirm Password/i)).toBeVisible();
			await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
		});

		test('shows link to login', async ({ page }) => {
			await page.goto('/auth/signup');
			await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible();
		});

		test('navigates to login when Sign in clicked', async ({ page }) => {
			await page.goto('/auth/signup');
			await page.getByRole('link', { name: /Sign in/i }).click();
			await expect(page).toHaveURL(/\/auth\/login/);
		});
	});

	test.describe('Favorites auth guard', () => {
		test('redirects unauthenticated users from favorites to login', async ({ page }) => {
			await page.goto('/favorites');
			// Should eventually redirect to login
			await expect(page).toHaveURL(/\/auth\/login/);
		});
	});
});
