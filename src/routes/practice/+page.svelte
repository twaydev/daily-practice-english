<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { practiceStore } from "$lib/stores/practice";
  import { authStore } from "$lib/stores/auth";
  import {
    saveUserSentence,
    updateSentenceTags,
    updateSentencePhoneticData,
    addPracticeEntry,
    uploadRecording,
    updatePracticeEntryAudio,
  } from "$lib/services/supabase";
  import type {
    Sentence,
    PhoneticAnalysis,
    PhrasalAnalysis,
    ContentType,
  } from "$lib/types";
  import PhoneticResult from "$lib/components/PhoneticResult.svelte";
  import SpeechRecorder from "$lib/components/SpeechRecorder.svelte";
  import TagInput from "$lib/components/TagInput.svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import AudioButton from "$lib/components/AudioButton.svelte";
  import { toast } from "svelte-sonner";
  import Icon from "@iconify/svelte";

  let inputText = $state("");
  let contentType = $state<ContentType>("sentence");
  let savedSentence = $state<Sentence | null>(null);
  let saveStatus = $state<"idle" | "saved" | "duplicate">("idle");

  onMount(() => {
    const urlText = $page.url.searchParams.get("text");
    const urlType = $page.url.searchParams.get("type") as ContentType | null;
    if (urlText) inputText = urlText;
    if (urlType === "sentence" || urlType === "phrasal") contentType = urlType;
    practiceStore.clear();

    let analyzed = false;
    const unsubscribe = authStore.subscribe((state) => {
      if (state.loading) return;
      if (!state.user) {
        goto(`${base}/auth/login`);
        return;
      }
      // Auto-analyze when arriving from a sentence card (once only)
      if (urlText && !analyzed) {
        analyzed = true;
        handleAnalyze();
      }
    });

    return unsubscribe;
  });

  async function handleAnalyze() {
    if (!$authStore.user) return;
    const text = inputText.trim();
    if (!text) {
      toast.error("Please enter a sentence or phrasal verb");
      return;
    }

    savedSentence = null;
    saveStatus = "idle";

    // Show loading immediately
    practiceStore.setLoading(true);

    // For logged-in users: save/retrieve the sentence and check for a cached analysis
    let cachedAnalysis: PhoneticAnalysis | PhrasalAnalysis | undefined;

    if ($authStore.user) {
      try {
        const { sentence, isNew } = await saveUserSentence(
          $authStore.user.id,
          text,
          contentType,
        );
        savedSentence = sentence;
        saveStatus = isNew ? "saved" : "duplicate";

        if (sentence.phonetic_data) {
          cachedAnalysis = sentence.phonetic_data as
            | PhoneticAnalysis
            | PhrasalAnalysis;
        }
      } catch {
        // Non-critical — fall through to OpenAI
      }
    }

    // analyze() uses the cache if provided, calls OpenAI otherwise
    await practiceStore.analyze(text, contentType, cachedAnalysis);

    // Persist fresh analysis back to the sentence so next call is a cache hit
    if (
      $authStore.user &&
      savedSentence &&
      !savedSentence.phonetic_data &&
      $practiceStore.analysis
    ) {
      const analysis = $practiceStore.analysis;
      updateSentencePhoneticData(savedSentence.id, $authStore.user.id, analysis)
        .then(() => {
          if (savedSentence)
            savedSentence = { ...savedSentence, phonetic_data: analysis };
        })
        .catch(() => {});
    }
  }

  async function handleRecorded(transcript: string, score: number, blob: Blob | null) {
    if (!$authStore.user) return;
    if (!transcript && !blob) return;
    const entryId = await addPracticeEntry(
      $authStore.user.id,
      savedSentence?.id ?? null,
      $practiceStore.currentSentence,
      transcript,
      score,
    );
    if (blob) {
      try {
        const path = await uploadRecording($authStore.user.id, entryId, blob);
        await updatePracticeEntryAudio(entryId, path);
      } catch (err) {
        console.error('[uploadRecording]', err);
        const msg = err instanceof Error ? err.message : 'Upload failed';
        toast.error(`Recording upload failed: ${msg}`);
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze();
  }

  function reset() {
    practiceStore.clear();
    savedSentence = null;
    saveStatus = "idle";
  }
</script>

<svelte:head>
  <title>Practice – English Practice</title>
</svelte:head>

<div class="space-y-6 max-w-4xl mx-auto">
  {#if !$practiceStore.analysis && !$practiceStore.loading}
    <div class="max-w-xl mx-auto space-y-6">
      <div class="text-center">
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight mb-1">Practice</h1>
        <p class="text-sm text-muted-foreground">
          Enter any English sentence or phrasal verb to get IPA phonetics and pronunciation tips.
        </p>
      </div>

      <Card>
        <CardContent class="pt-5 space-y-4">
          <!-- Segmented mode toggle -->
          <div class="flex rounded-lg bg-muted p-1 gap-1">
            <button
              onclick={() => { contentType = "sentence"; practiceStore.setContentType("sentence"); }}
              class="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all {contentType === 'sentence' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
            >
              <Icon icon="mdi:text-box-outline" width="15" />
              Sentence
            </button>
            <button
              onclick={() => { contentType = "phrasal"; practiceStore.setContentType("phrasal"); }}
              class="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all {contentType === 'phrasal' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
            >
              <Icon icon="mdi:book-open-variant" width="15" />
              Phrasal Verb
            </button>
          </div>

          <!-- Input -->
          {#if contentType === "sentence"}
            <textarea
              id="practice-input"
              bind:value={inputText}
              onkeydown={handleKeyDown}
              placeholder="e.g. I'm looking to transition into a new industry."
              rows="3"
              class="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            ></textarea>
          {:else}
            <input
              id="practice-input"
              type="text"
              bind:value={inputText}
              onkeydown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
              placeholder="e.g. give up, take on, bring up…"
              class="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          {/if}

          <!-- Action -->
          {#if $authStore.user}
            <Button
              onclick={handleAnalyze}
              disabled={!inputText.trim()}
              class="w-full h-11"
            >
              <Icon icon="mdi:magnify" width="18" class="mr-2" />
              Analyze Pronunciation
              <kbd class="ml-auto font-sans text-xs opacity-40 hidden sm:inline">⌘ ↵</kbd>
            </Button>
          {:else if !$authStore.loading}
            <div class="rounded-md bg-muted/50 border px-4 py-3 text-sm text-center text-muted-foreground">
              <a href="{base}/auth/login" class="text-primary font-medium hover:underline">Sign in</a>
              to analyze sentences and track your practice.
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Error -->
  {#if $practiceStore.error}
    <div
      class="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
    >
      <Icon icon="mdi:alert-circle" width="18" class="flex-shrink-0 mt-0.5" />
      <span>{$practiceStore.error}</span>
    </div>
  {/if}

  <!-- Loading Skeleton -->
  {#if $practiceStore.loading}
    <div class="space-y-4">
      {#each { length: 3 } as _}
        <div class="space-y-2 p-4 border rounded-lg">
          <Skeleton class="h-5 w-40" />
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-4 w-3/4" />
        </div>
      {/each}
    </div>
  {/if}

  <!-- Result: 2-column layout -->
  {#if $practiceStore.analysis && !$practiceStore.loading}
    <!-- Phonetic Transcription: full width -->
    <Card>
      <CardHeader class="pb-2">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">Phonetic Transcription</CardTitle>
          <div class="flex items-center gap-2">
            <AudioButton text={$practiceStore.currentSentence} />
            <button
              onclick={reset}
              class="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Icon icon="mdi:pencil" width="13" />
              New
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm text-muted-foreground italic">
          "{$practiceStore.currentSentence}"
        </p>
        <p class="font-mono text-lg sm:text-2xl tracking-wide text-primary break-all">
          {$practiceStore.analysis.ipa}
        </p>
        <p class="text-sm text-muted-foreground">
          Stress: <span class="font-semibold text-foreground"
            >{$practiceStore.analysis.stress}</span
          >
        </p>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-start">
      <!-- Left: phonetic analysis -->
      <PhoneticResult
        analysis={$practiceStore.analysis}
        sentence={$practiceStore.currentSentence}
        contentType={$practiceStore.contentType}
      />

      <!-- Right: speech recorder + save panel -->
      <div class="space-y-4">
        <SpeechRecorder
          targetText={$practiceStore.currentSentence}
          onRecorded={handleRecorded}
        />

        {#if $authStore.user && savedSentence}
          <div class="rounded-md border bg-muted/30 p-3 space-y-2">
            <p class="text-xs font-medium flex items-center gap-1.5">
              {#if saveStatus === "saved"}
                <Icon
                  icon="mdi:check-circle"
                  width="14"
                  class="text-green-500"
                />
                Saved to your collection
              {:else}
                <Icon
                  icon="mdi:bookmark-check"
                  width="14"
                  class="text-muted-foreground"
                />
                Already in your collection
              {/if}
            </p>
            <TagInput
              bind:tags={savedSentence.tags}
              onSave={(tags) =>
                updateSentenceTags(
                  savedSentence!.id,
                  $authStore.user!.id,
                  tags,
                )}
            />
          </div>
        {:else if !$authStore.user && !$authStore.loading}
          <p class="text-xs text-muted-foreground">
            <a href="{base}/auth/login" class="text-primary hover:underline"
              >Sign in</a
            >
            to save this to your collection, add tags, and track speech history.
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>
