import { test, expect } from '@playwright/test';

test.describe('Practice page', () => {
	test('loads practice page', async ({ page }) => {
		await page.goto('/practice');
		await expect(page.getByRole('heading', { name: /Practice/i })).toBeVisible();
	});

	test('shows Sentence and Phrasal Verb mode toggle', async ({ page }) => {
		await page.goto('/practice');
		await expect(page.getByText(/Sentence/i).first()).toBeVisible();
		await expect(page.getByText(/Phrasal Verb/i).first()).toBeVisible();
	});

	test('shows textarea for sentence input', async ({ page }) => {
		await page.goto('/practice');
		await expect(page.locator('textarea#practice-input')).toBeVisible();
	});

	test('pre-fills text from query param', async ({ page }) => {
		await page.goto('/practice?text=Hello+world&type=sentence');
		const textarea = page.locator('textarea#practice-input');
		await expect(textarea).toHaveValue('Hello world');
	});

	test('pre-fills phrasal mode from query param', async ({ page }) => {
		await page.goto('/practice?text=give+up&type=phrasal');
		const input = page.locator('input#practice-input');
		await expect(input).toHaveValue('give up');
	});

	test('Analyze button is disabled when input is empty', async ({ page }) => {
		await page.goto('/practice');
		const analyzeButton = page.getByRole('button', { name: /Analyze/i });
		await expect(analyzeButton).toBeDisabled();
	});

	test('Analyze button becomes enabled when text is entered', async ({ page }) => {
		await page.goto('/practice');
		await page.locator('textarea#practice-input').fill('I am learning English.');
		const analyzeButton = page.getByRole('button', { name: /Analyze/i });
		await expect(analyzeButton).toBeEnabled();
	});
});
