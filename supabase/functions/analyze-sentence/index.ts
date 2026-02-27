import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const sentencePrompt = (sentence: string) =>
	`Given the English sentence "${sentence}", return a JSON object with these exact keys:
- ipa: Full IPA transcription of the sentence (e.g. "/aɪ æm ˈlʊkɪŋ/")
- stress: Sentence with stressed syllables in CAPS (e.g. "i am LOO-king")
- tips: Array of 3-5 pronunciation tips as strings
- breakdown: Array of objects, each with "word" (string) and "ipa" (string) keys for each significant word

Return only valid JSON, no markdown.`;

const phrasalPrompt = (phrasal: string) =>
	`Given the English phrasal verb "${phrasal}", return a JSON object with these exact keys:
- ipa: IPA transcription (e.g. "/ɡɪv ʌp/")
- stress: Stressed syllables in CAPS (e.g. "give UP")
- tips: Array of 3-5 pronunciation tips as strings
- breakdown: Array of objects with "word" and "ipa" keys for each word
- definition: Concise meaning as a string (e.g. "to stop trying or doing something")
- usage_examples: Array of exactly 3 natural example sentences using this phrasal verb
- formVariants: Array of all conjugated forms (e.g. ["give up", "gives up", "gave up", "given up", "giving up"])
- register: One of exactly "formal", "informal", or "neutral"

Return only valid JSON, no markdown.`;

serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	// Manual auth check — verify the caller is a signed-in user.
	// verify_jwt is disabled at the gateway because production uses ES256 tokens
	// that the gateway's built-in HS256 verifier rejects. We validate here instead.
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	const supabase = createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_ANON_KEY')!,
		{ global: { headers: { Authorization: authHeader } } }
	);

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		const { sentence, content_type } = await req.json();

		if (!sentence || typeof sentence !== 'string') {
			return new Response(JSON.stringify({ error: 'sentence is required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		if (sentence.length > 50) {
			return new Response(JSON.stringify({ error: 'sentence must be 50 characters or fewer' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const openaiKey = Deno.env.get('OPENAI_API_KEY');
		if (!openaiKey) {
			return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const userPrompt =
			content_type === 'phrasal' ? phrasalPrompt(sentence) : sentencePrompt(sentence);

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${openaiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content:
							'You are an expert linguist specializing in English phonetics and pronunciation for non-native speakers. Always return valid JSON only.'
					},
					{ role: 'user', content: userPrompt }
				],
				response_format: { type: 'json_object' },
				temperature: 0.3
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			throw new Error('No content in OpenAI response');
		}

		const analysis = JSON.parse(content);

		return new Response(JSON.stringify(analysis), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Internal server error';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
