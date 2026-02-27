import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/unit/**/*.test.ts'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['tests/setup.ts']
	}
});
