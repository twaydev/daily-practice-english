import { writable } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '$lib/services/supabase';

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set } = writable<AuthState>({
		user: null,
		session: null,
		loading: true
	});

	return {
		subscribe,

		async initialize() {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			set({ user: session?.user ?? null, session, loading: false });

			supabase.auth.onAuthStateChange((_event, session) => {
				set({ user: session?.user ?? null, session, loading: false });
			});
		},

		async signIn(email: string, password: string): Promise<void> {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
		},

		async signUp(email: string, password: string): Promise<void> {
			const { error } = await supabase.auth.signUp({ email, password });
			if (error) throw error;
		},

		async signOut(): Promise<void> {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
		}
	};
}

export const authStore = createAuthStore();
