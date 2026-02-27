import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore missing favicon during prerender
				if (path.includes('favicon')) return;
				throw new Error(message);
			}
		},
		paths: {
			base: ''
		}
	}
};

export default config;
