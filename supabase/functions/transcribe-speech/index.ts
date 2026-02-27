import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

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

	const openaiKey = Deno.env.get('OPENAI_API_KEY');
	if (!openaiKey) {
		return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		const formData = await req.formData();
		const audioFile = formData.get('file');

		if (!audioFile || !(audioFile instanceof File)) {
			return new Response(JSON.stringify({ error: 'audio file is required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const whisperForm = new FormData();
		whisperForm.append('file', audioFile, audioFile.name || 'recording.webm');
		whisperForm.append('model', 'whisper-1');
		whisperForm.append('language', 'en');

		const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST',
			headers: { Authorization: `Bearer ${openaiKey}` },
			body: whisperForm
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Whisper API error: ${response.status} ${errorText}`);
		}

		const data = await response.json();

		return new Response(JSON.stringify({ transcript: data.text ?? '' }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Transcription failed';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
