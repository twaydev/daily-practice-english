<script lang="ts">
	type Props = {
		tags: string[];
		onSave: (tags: string[]) => Promise<void>;
		disabled?: boolean;
	};

	let { tags = $bindable([]), onSave, disabled = false }: Props = $props();

	let inputValue = $state('');
	let saving = $state(false);
	let saveError = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout>;

	function normalise(raw: string) {
		return raw.trim().toLowerCase().replace(/\s+/g, '-');
	}

	function addTag(raw: string) {
		const tag = normalise(raw);
		if (tag && !tags.includes(tag)) {
			tags = [...tags, tag];
			scheduleSave();
		}
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
		scheduleSave();
	}

	function scheduleSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(async () => {
			saving = true;
			saveError = false;
			try {
				await onSave(tags);
			} catch {
				saveError = true;
			} finally {
				saving = false;
			}
		}, 400);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			if (inputValue.trim()) {
				addTag(inputValue);
				inputValue = '';
			}
		} else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
			removeTag(tags[tags.length - 1]);
		}
	}

	function handleBlur() {
		if (inputValue.trim()) {
			addTag(inputValue);
			inputValue = '';
		}
	}
</script>

<div class="space-y-1.5">
	<div
		class="flex flex-wrap items-center gap-1.5 min-h-[38px] rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 {disabled ? 'opacity-50 pointer-events-none' : ''}"
	>
		{#each tags as tag}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
			>
				{tag}
				<button
					type="button"
					onclick={() => removeTag(tag)}
					class="ml-0.5 rounded-full hover:bg-primary/20 p-1 leading-none"
					aria-label="Remove tag {tag}"
				>
					×
				</button>
			</span>
		{/each}

		<input
			type="text"
			bind:value={inputValue}
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			placeholder={tags.length === 0 ? 'Add tags… (Enter or comma to confirm)' : ''}
			class="flex-1 min-w-[80px] sm:min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			{disabled}
		/>
	</div>

	<div class="flex items-center gap-1 h-4">
		{#if saving}
			<span class="text-xs text-muted-foreground">Saving…</span>
		{:else if saveError}
			<span class="text-xs text-destructive">Failed to save tags</span>
		{/if}
	</div>
</div>
