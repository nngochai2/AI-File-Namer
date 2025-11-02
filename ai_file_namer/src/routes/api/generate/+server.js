// @ts-nocheck
import { json } from "@sveltejs/kit";
import { GoogleGenAI, Type } from "@google/genai";
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';


/**
 * POST handler to receive the user's description and request filenames from Gemini.
 *@type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	try {
		// 1. Get the user's data from the request body
		const { description } = await request.json();

		// 1.a Read the API key at runtime and validate it
		const apiKey = env.GEMINI_API_KEY;
		if (!apiKey) {
			console.error('Missing GEMINI_API_KEY in environment');
			return json({ success: false, error: 'Server misconfiguration: missing API key.' }, { status: 500 });
		}

		// Initialize the Gemini client at runtime (ensures the env var is present)
		const ai = new GoogleGenAI({ apiKey });

		// 2. Define the strict System Instruction
		const systemInstruction = 
            `You are a professional file naming expert. 
            Your sole task is to take a document description and provide 5 suggested filenames. 
            The output MUST be a JSON array of strings, with NO other commentary, markdown ticks, or text.
            Filenames must be lowercase, use hyphens instead of spaces, and have appropriate file extensions (like .pdf, .doc, .jpg, etc.)`;

		// 3. Validate input
		if (!description || typeof description !== 'string' || !description.trim()) {
			return json({ success: false, error: 'Invalid request: description is required.' }, { status: 400 });
		}

		// 4. Call the Gemini API with structured output config
		let response;
		try {
			response = await ai.models.generateContent({
				model: 'gemini-2.5-flash',
				contents: description,
				config: {
					systemInstruction,
					temperature: 0.3, // Lower temp for less creative, more predictable output
					responseMimeType: 'application/json',
					responseSchema: {
						type: Type.ARRAY,
						items: {
							type: Type.STRING,
							description: "A clean, hyphenated, lowercase filename including an extension."
						}
					}
				}
			});
		} catch (callErr) {
			console.error('Gemini API call failed:', callErr);
			// In dev return the real error message to help debugging; in prod keep generic
			return json(
				{ success: false, error: dev ? `AI call error: ${String(callErr?.message || callErr)}` : 'AI Error: Could not generate names.' },
				{ status: 500 }
			);
		}

		// 4. Extract and safely parse the JSON response text (be defensive - SDK shapes vary)
		let rawText = '';
		if (typeof response?.text === 'string') {
			rawText = response.text.trim();
		} else if (Array.isArray(response?.candidates) && response.candidates[0]) {
			const c = response.candidates[0];
			rawText = typeof c?.content === 'string' ? c.content.trim() : JSON.stringify(c.content);
		} else if (Array.isArray(response?.output) && response.output[0]) {
			// try to flatten output content
			const out = response.output[0];
			if (typeof out?.content === 'string') rawText = out.content.trim();
			else if (Array.isArray(out?.content)) rawText = out.content.map(x => x?.text || (typeof x === 'string' ? x : '')).join(' ').trim();
			else rawText = JSON.stringify(out.content);
		} else {
			rawText = JSON.stringify(response);
		}

		let generatedNames;
		try {
			generatedNames = JSON.parse(rawText);
		} catch (parseError) {
			console.error('Could not parse AI response as JSON:', parseError, 'raw:', rawText);
			return json(
				{ success: false, error: dev ? `AI parse error: ${String(parseError?.message || parseError)} -- raw: ${rawText}` : 'AI returned unexpected response format.' },
				{ status: 500 }
			);
		}

		if (!Array.isArray(generatedNames)) {
			console.error('AI returned non-array result:', generatedNames);
			return json(
				{ success: false, error: dev ? `AI returned non-array result: ${JSON.stringify(generatedNames)}` : 'AI returned unexpected response format.' },
				{ status: 500 }
			);
		}

		// 5. Send the names back to Svelte component 
		return json({ success: true, names: generatedNames});
	
	} catch (error) {
		console.error('Gemini API Error: ', error);
		return json(
			{ success: false, error: 'AI Error: Could not generate names. Check your API key or description.' }, 
			{ status: 500 }
		); 
	}
}

