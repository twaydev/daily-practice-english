<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';

	let menuOpen = $state(false);

	async function handleSignOut() {
		menuOpen = false;
		try {
			await authStore.signOut();
			await goto(`${base}/`);
			toast.success('Signed out successfully');
		} catch {
			toast.error('Sign out failed');
		}
	}

	const navLinks = [
		{ href: `${base}/`, label: 'Home' },
		{ href: `${base}/practice`, label: 'Practice' },
		{ href: `${base}/favorites`, label: 'Favorites' },
		{ href: `${base}/history`, label: 'History' }
	];

	function isActive(href: string) {
		return $page.url.pathname === href;
	}
</script>

<nav class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="mx-auto max-w-5xl px-4 py-3">
		<div class="flex items-center justify-between">
			<a href="{base}/" class="flex items-center gap-2 font-bold text-lg text-primary">
				<Icon icon="mdi:microphone" width="24" />
				<span class="hidden sm:inline">English Practice</span>
			</a>

			<!-- Desktop nav -->
			<div class="hidden sm:flex items-center gap-1 sm:gap-2">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground {isActive(link.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}"
					>
						{link.label}
					</a>
				{/each}

				{#if $authStore.user}
					<Button variant="ghost" size="sm" onclick={handleSignOut} class="ml-2">
						<Icon icon="mdi:logout" width="18" />
						<span class="ml-1">Sign Out</span>
					</Button>
				{:else}
					<a href="{base}/auth/login" class="ml-2">
						<Button size="sm">
							<Icon icon="mdi:login" width="18" />
							<span class="ml-1">Login</span>
						</Button>
					</a>
				{/if}
			</div>

			<!-- Mobile: hamburger button -->
			<button
				onclick={() => (menuOpen = !menuOpen)}
				class="sm:hidden p-2 rounded-md hover:bg-accent transition-colors"
				aria-label="Toggle menu"
				aria-expanded={menuOpen}
			>
				<Icon icon={menuOpen ? 'mdi:close' : 'mdi:menu'} width="24" />
			</button>
		</div>
	</div>

	<!-- Mobile dropdown menu -->
	{#if menuOpen}
		<div class="sm:hidden border-t bg-background px-4 py-2 space-y-0.5">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={() => (menuOpen = false)}
					class="flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground {isActive(link.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}"
				>
					{link.label}
				</a>
			{/each}
			<div class="border-t mt-2 pt-2">
				{#if $authStore.user}
					<button
						onclick={handleSignOut}
						class="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
					>
						<Icon icon="mdi:logout" width="18" />
						Sign Out
					</button>
				{:else}
					<a
						href="{base}/auth/login"
						onclick={() => (menuOpen = false)}
						class="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
					>
						<Icon icon="mdi:login" width="18" />
						Sign In
					</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>
