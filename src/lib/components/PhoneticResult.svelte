<script lang="ts">
	import type { PhoneticAnalysis, PhrasalAnalysis, ContentType } from '$lib/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import AudioButton from './AudioButton.svelte';
	import PhrasalExamples from './PhrasalExamples.svelte';

	type Props = {
		analysis: PhoneticAnalysis | PhrasalAnalysis;
		sentence: string;
		contentType: ContentType;
	};

	let { analysis, sentence, contentType }: Props = $props();

	const isPhrasal = $derived(contentType === 'phrasal');
	const phrasalAnalysis = $derived(isPhrasal ? (analysis as PhrasalAnalysis) : null);

	const registerColors: Record<string, string> = {
		formal: 'bg-blue-100 text-blue-800',
		informal: 'bg-orange-100 text-orange-800',
		neutral: 'bg-gray-100 text-gray-800'
	};
</script>

<div class="space-y-4">
	<!-- Word Breakdown -->
	{#if analysis.breakdown?.length > 0}
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-base">Word-by-Word Breakdown</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b">
								<th class="pb-2 text-left font-medium text-muted-foreground">Word</th>
								<th class="pb-2 text-left font-medium text-muted-foreground">IPA</th>
								<th class="pb-2 text-left font-medium text-muted-foreground">Listen</th>
							</tr>
						</thead>
						<tbody>
							{#each analysis.breakdown as item}
								<tr class="border-b last:border-0">
									<td class="py-2 pr-4 font-medium">{item.word}</td>
									<td class="py-2 pr-4 font-mono text-primary">{item.ipa}</td>
									<td class="py-2">
										<AudioButton text={item.word} size="sm" />
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Tips -->
	{#if analysis.tips?.length > 0}
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-base">Pronunciation Tips</CardTitle>
			</CardHeader>
			<CardContent>
				<ul class="space-y-2">
					{#each analysis.tips as tip}
						<li class="flex items-start gap-2 text-sm">
							<span class="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary"></span>
							{tip}
						</li>
					{/each}
				</ul>
			</CardContent>
		</Card>
	{/if}

	<!-- Phrasal verb extras -->
	{#if isPhrasal && phrasalAnalysis}
		<!-- Definition -->
		<Card class="border-purple-200 bg-purple-50/30">
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-base">Definition</CardTitle>
					{#if phrasalAnalysis.register}
						<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {registerColors[phrasalAnalysis.register] ?? registerColors.neutral}">
							{phrasalAnalysis.register}
						</span>
					{/if}
				</div>
			</CardHeader>
			<CardContent>
				<p class="text-sm">{phrasalAnalysis.definition}</p>
			</CardContent>
		</Card>

		<!-- Form Variants -->
		{#if phrasalAnalysis.formVariants?.length > 0}
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-base">Form Variants</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex flex-wrap gap-2">
						{#each phrasalAnalysis.formVariants as form}
							<div class="flex items-center gap-1">
								<Badge variant="outline" class="font-mono">{form}</Badge>
								<AudioButton text={form} size="sm" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Usage Examples -->
		{#if phrasalAnalysis.usage_examples?.length > 0}
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-base">Usage Examples</CardTitle>
				</CardHeader>
				<CardContent>
					<PhrasalExamples examples={phrasalAnalysis.usage_examples} />
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>
