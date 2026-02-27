import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock supabase before importing the store
vi.mock('$lib/services/supabase', () => {
	const mockSession = {
		user: { id: 'user-123', email: 'test@example.com' },
		access_token: 'mock-token'
	};

	const mockAuth = {
		getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
		onAuthStateChange: vi.fn().mockImplementation((cb) => {
			// Don't call the callback immediately in tests
			return { data: { subscription: { unsubscribe: vi.fn() } } };
		}),
		signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
		signUp: vi.fn().mockResolvedValue({ error: null }),
		signOut: vi.fn().mockResolvedValue({ error: null })
	};

	return {
		supabase: {
			auth: mockAuth
		}
	};
});

describe('authStore', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('initializes with loading state', async () => {
		const { authStore } = await import('$lib/stores/auth');
		const state = get(authStore);
		expect(state.loading).toBe(true);
		expect(state.user).toBeNull();
		expect(state.session).toBeNull();
	});

	it('updates state after initialize()', async () => {
		const { authStore } = await import('$lib/stores/auth');
		await authStore.initialize();

		const state = get(authStore);
		expect(state.loading).toBe(false);
		expect(state.user?.email).toBe('test@example.com');
	});

	it('calls signInWithPassword on signIn()', async () => {
		const { supabase } = await import('$lib/services/supabase');
		const { authStore } = await import('$lib/stores/auth');

		await authStore.signIn('test@example.com', 'password123');

		expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'password123'
		});
	});

	it('calls signUp on signUp()', async () => {
		const { supabase } = await import('$lib/services/supabase');
		const { authStore } = await import('$lib/stores/auth');

		await authStore.signUp('new@example.com', 'password123');

		expect(supabase.auth.signUp).toHaveBeenCalledWith({
			email: 'new@example.com',
			password: 'password123'
		});
	});

	it('calls signOut on signOut()', async () => {
		const { supabase } = await import('$lib/services/supabase');
		const { authStore } = await import('$lib/stores/auth');

		await authStore.signOut();

		expect(supabase.auth.signOut).toHaveBeenCalled();
	});

	it('throws when signIn returns error', async () => {
		const { supabase } = await import('$lib/services/supabase');
		const { authStore } = await import('$lib/stores/auth');

		vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
			error: { message: 'Invalid credentials' }
		} as never);

		await expect(authStore.signIn('bad@example.com', 'wrong')).rejects.toMatchObject({
			message: 'Invalid credentials'
		});
	});
});
