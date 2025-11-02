# AI File Namer

A small SvelteKit app that uses Google Gemini (via `@google/genai`) to suggest well-formatted filenames from a short description. It exposes a secure server endpoint that calls the GenAI model and returns a JSON array of suggested filenames.

This repository is a compact demo and starter for integrating a text-generation model into a web UI where the model output is constrained and validated.

## Features

- SvelteKit frontend with a textarea to enter a document description.
- Server-side endpoint (`/api/generate`) that calls the GenAI client and returns 5 filename suggestions.
- Input validation using `zod` (trim, non-empty, min/max length).
- Clipboard-friendly UI with a smooth "Copy → Copied" transition for suggested names.
- Defensive server parsing and helpful dev-mode error messages.

## Stack / Key dependencies

- SvelteKit
- Vite
- @google/genai (Gemini client)
- zod (input validation)

See `package.json` for exact versions.

## Prerequisites

- Node.js 18+ (or the version your environment expects)
- npm (or pnpm/yarn)
- A Google Gemini API key with access to the model used in this project. Store it in an environment variable called `GEMINI_API_KEY`.

## Setup

1. Clone the repository and install dependencies (from project root):

```bash
npm install
```

2. Create a `.env.local` file at the project root (next to `package.json`) and add your key:

```
GEMINI_API_KEY=YOUR_REAL_KEY_HERE
```

> Important: Do NOT commit `.env.local` to source control. Ensure your `.gitignore` contains it.

3. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` (or the port printed by dev server) and try the textarea.

## API: /api/generate

- Method: POST
- Content-Type: application/json
- Body shape: `{ "description": "...your description..." }`

Success response:

```json
{ "success": true, "names": ["file-name-1.pdf", "file-name-2.docx", ...] }
```

Failure responses include a `success: false` and an `error` message. Validation errors return HTTP 400 with a message assembled from Zod issues.

### Example curl

```bash
curl -X POST 'http://localhost:5173/api/generate' \
	-H 'Content-Type: application/json' \
	-d '{"description":"List of employee names in my company"}'
```

## Validation rules (server-side)

Validation is implemented with `src/lib/schema.js` using `zod`:

- `description` is trimmed
- must be non-empty (custom message)
- must be at least 10 characters
- must be at most 500 characters

The server uses `FilenameSchema.safeParse(body)` to validate the incoming JSON before calling the model.

## UI details

- `src/routes/+page.svelte` contains the main UI. It posts to the server route at `api/generate` and renders results.
- Copy buttons use the Clipboard API and show a transient "Copied" state for UX clarity.

## Error handling & debugging

- The server route performs defensive parsing of the GenAI SDK response and returns helpful error messages in dev mode.
- If you get an error about the API key, ensure `GEMINI_API_KEY` is set and the dev server was restarted after creating/updating `.env.local`.
- If validation fails, check the description length and whitespace (the schema trims input first).

## Deployment

- Use your hosting provider's secret management to set `GEMINI_API_KEY` in production instead of `.env.local`.
- This project includes `@sveltejs/adapter-*` packages in devDependencies; choose and configure an adapter for your target platform (Vercel, Netlify, Cloudflare Pages, etc.).

## Security & privacy

- Never commit secrets. Use the hosting platform's environment variables for production.
- Model requests may be logged by the model provider—avoid sending highly sensitive personal or proprietary data unless your contract and security posture permit it.

## Development notes & suggestions

- Convert server routes to TypeScript (`+server.ts`) if you want stronger types for request/response objects.
- Add tests that exercise `src/lib/schema.js` to assert validation behaviour across edge cases.
- Consider sanitizing or escaping user-supplied content before rendering or storing it.

## Contributing

PRs are welcome. Keep changes small and focused. If adding features that change the API shape, update this README and add tests.

## License

Choose a license for your project (e.g., MIT). This repo currently does not include a license file.
