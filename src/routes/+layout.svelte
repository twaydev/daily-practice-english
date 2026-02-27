<script lang="ts">
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import NavBar from '$lib/components/NavBar.svelte';
	import { authStore } from '$lib/stores/auth';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		authStore.initialize();
	});
</script>

<div class="min-h-screen flex flex-col">
	<NavBar />
	<main class="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 py-4 sm:py-6">
		{@render children()}
	</main>
</div>

<Toaster richColors position="top-right" />
