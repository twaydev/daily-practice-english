<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let mode = $state<'password' | 'magic'>('password');
	let magicSent = $state(false);

	async function handlePasswordSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		try {
			await authStore.signIn(email, password);
			const redirect = $page.url.searchParams.get('redirect') ?? '/';
			toast.success('Welcome back!');
			goto(`${base}${redirect}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Sign in failed');
		} finally {
			loading = false;
		}
	}

	async function handleMagicSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		try {
			await authStore.signInWithMagicLink(email);
			magicSent = true;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not send magic link');
		} finally {
			loading = false;
		}
	}

	function switchMode(m: 'password' | 'magic') {
		mode = m;
		magicSent = false;
	}
</script>

<svelte:head>
	<title>Login – English Practice</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[60vh]">
	<Card class="w-full max-w-sm">
		<CardHeader class="text-center">
			<div class="flex justify-center mb-2">
				<Icon icon="mdi:account-circle" width="48" class="text-primary" />
			</div>
			<CardTitle>Welcome back</CardTitle>
			<CardDescription>Sign in to track your progress and favorites</CardDescription>
		</CardHeader>

		<!-- Mode toggle -->
		<div class="px-6 pb-2">
			<div class="flex rounded-lg bg-muted p-1 gap-1">
				<button
					onclick={() => switchMode('password')}
					class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all {mode === 'password' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
				>
					Password
				</button>
				<button
					onclick={() => switchMode('magic')}
					class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all {mode === 'magic' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
				>
					Magic Link
				</button>
			</div>
		</div>

		{#if mode === 'password'}
			<form onsubmit={handlePasswordSubmit}>
				<CardContent class="space-y-4">
					<div class="space-y-1.5">
						<label for="email" class="text-sm font-medium">Email</label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							required
							autocomplete="email"
						/>
					</div>
					<div class="space-y-1.5">
						<label for="password" class="text-sm font-medium">Password</label>
						<Input
							id="password"
							type="password"
							bind:value={password}
							placeholder="••••••••"
							required
							autocomplete="current-password"
						/>
					</div>
				</CardContent>

				<CardFooter class="flex flex-col gap-3">
					<Button type="submit" class="w-full" disabled={loading}>
						{#if loading}
							<Icon icon="mdi:loading" width="18" class="animate-spin mr-2" />
							Signing in...
						{:else}
							Sign In
						{/if}
					</Button>
					<p class="text-sm text-center text-muted-foreground">
						Don't have an account?
						<a href="{base}/auth/signup" class="text-primary hover:underline">Sign up</a>
					</p>
				</CardFooter>
			</form>
		{:else if !magicSent}
			<form onsubmit={handleMagicSubmit}>
				<CardContent class="space-y-4">
					<p class="text-sm text-muted-foreground">
						Enter your email and we'll send you a one-click sign-in link. No password needed.
					</p>
					<div class="space-y-1.5">
						<label for="magic-email" class="text-sm font-medium">Email</label>
						<Input
							id="magic-email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							required
							autocomplete="email"
						/>
					</div>
				</CardContent>

				<CardFooter class="flex flex-col gap-3">
					<Button type="submit" class="w-full" disabled={loading}>
						{#if loading}
							<Icon icon="mdi:loading" width="18" class="animate-spin mr-2" />
							Sending...
						{:else}
							<Icon icon="mdi:email-fast-outline" width="18" class="mr-2" />
							Send Magic Link
						{/if}
					</Button>
					<p class="text-sm text-center text-muted-foreground">
						Don't have an account?
						<a href="{base}/auth/signup" class="text-primary hover:underline">Sign up</a>
					</p>
				</CardFooter>
			</form>
		{:else}
			<CardContent class="space-y-4 text-center py-6">
				<Icon icon="mdi:email-check-outline" width="48" class="mx-auto text-primary" />
				<div>
					<p class="font-medium">Check your inbox</p>
					<p class="text-sm text-muted-foreground mt-1">
						We sent a magic link to <span class="font-medium text-foreground">{email}</span>.
						Click it to sign in — the link expires in 1 hour.
					</p>
				</div>
				<button
					onclick={() => { magicSent = false; }}
					class="text-sm text-primary hover:underline"
				>
					Send again
				</button>
			</CardContent>
		{/if}
	</Card>
</div>
