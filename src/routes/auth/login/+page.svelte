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

	async function handleSubmit(e: SubmitEvent) {
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

		<form onsubmit={handleSubmit}>
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
	</Card>
</div>
