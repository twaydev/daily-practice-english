<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { setContext } from 'svelte';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		value?: string;
		onValueChange?: (value: string) => void;
	};

	let { class: className, value = $bindable(''), onValueChange, children, ...restProps }: Props = $props();

	setContext('tabs', {
		get value() { return value; },
		setValue(v: string) {
			value = v;
			onValueChange?.(v);
		}
	});
</script>

<div class={cn('w-full', className)} {...restProps}>
	{@render children?.()}
</div>
