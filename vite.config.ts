import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import path from 'path';

const isTest = !!process.env.VITEST;

export default defineConfig({
	plugins: [isTest ? svelte() : sveltekit()],
	resolve: isTest
		? {
				alias: {
					$lib: path.resolve('./src/lib'),
					$app: path.resolve('./node_modules/@sveltejs/kit/src/runtime/app'),
					'$env/static/public': path.resolve('./tests/__mocks__/env-static-public.ts')
				},
				conditions: ['browser', 'svelte']
			}
		: {},
	test: {
		include: ['tests/unit/**/*.test.ts'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['tests/setup.ts']
	}
});
