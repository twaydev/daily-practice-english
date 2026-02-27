import { vi } from 'vitest';

// Mock SvelteKit virtual modules
vi.mock('$env/static/public', () => ({
	PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
	PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-for-testing'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/paths', () => ({
	base: ''
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((cb) => {
			cb({ url: new URL('http://localhost/') });
			return () => {};
		})
	}
}));
