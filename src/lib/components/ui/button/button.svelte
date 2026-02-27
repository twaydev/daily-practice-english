<script lang="ts">
	import { cn } from '$lib/utils';
	import { buttonVariants, type ButtonVariants } from './index.js';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes &
		ButtonVariants & {
			class?: string;
		};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		children,
		...restProps
	}: Props = $props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {...restProps}>
	{@render children?.()}
</button>
