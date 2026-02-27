<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authStore } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			toast.error('Password must be at least 6 characters');
			return;
		}

		loading = true;

		try {
			await authStore.signUp(email, password);
			toast.success('Account created! Check your email to verify.');
			goto(`${base}/`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Sign up failed');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up – English Practice</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[60vh]">
	<Card class="w-full max-w-sm">
		<CardHeader class="text-center">
			<div class="flex justify-center mb-2">
				<Icon icon="mdi:account-plus" width="48" class="text-primary" />
			</div>
			<CardTitle>Create an account</CardTitle>
			<CardDescription>Sign up to save favorites and track your progress</CardDescription>
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
						autocomplete="new-password"
						minlength={6}
					/>
				</div>
				<div class="space-y-1.5">
					<label for="confirm-password" class="text-sm font-medium">Confirm Password</label>
					<Input
						id="confirm-password"
						type="password"
						bind:value={confirmPassword}
						placeholder="••••••••"
						required
						autocomplete="new-password"
					/>
				</div>
			</CardContent>

			<CardFooter class="flex flex-col gap-3">
				<Button type="submit" class="w-full" disabled={loading}>
					{#if loading}
						<Icon icon="mdi:loading" width="18" class="animate-spin mr-2" />
						Creating account...
					{:else}
						Create Account
					{/if}
				</Button>
				<p class="text-sm text-center text-muted-foreground">
					Already have an account?
					<a href="{base}/auth/login" class="text-primary hover:underline">Sign in</a>
				</p>
			</CardFooter>
		</form>
	</Card>
</div>
