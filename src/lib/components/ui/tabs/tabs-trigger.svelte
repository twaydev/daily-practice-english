<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { getContext } from 'svelte';

	type Props = HTMLButtonAttributes & {
		class?: string;
		value: string;
	};

	let { class: className, value, children, ...restProps }: Props = $props();

	const tabs = getContext<{ value: string; setValue: (v: string) => void }>('tabs');
	const isActive = $derived(tabs.value === value);
</script>

<button
	role="tab"
	aria-selected={isActive}
	class={cn(
		'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		isActive && 'bg-background text-foreground shadow-sm',
		className
	)}
	onclick={() => tabs.setValue(value)}
	{...restProps}
>
	{@render children?.()}
</button>
