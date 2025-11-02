<script>
	// 1. State Management
	let description = ""; // Binds to textarea input
	let generatedNames = []; // Stores the array of names from the API
	let isLoading = false; // Control the loading spinner
	let error = null; // Stores any error message from the server

	// 2. Function to handle the API call
	async function handleSubmit() {
		// Clear previous state and set loading flag
		generatedNames = [];
		error = null;
		isLoading = true;

		try {
			// Call the secure server endpoint
			const response = await fetch("api/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ description }),
			});

			const result = await response.json();

			if (!response.ok || result.success === false) {
				// Handle non-200 responses or server-reported errors
				error = result.error || "Unknown error occured during generation.";
				return; // Stop execution on error
			}

			// Success: Stored the generated names array
			generatedNames = result.names || [];
		} catch (e) {
			// Handle network errrors
			error = "Network error: Could not connect to the server.";
			console.error(e);
		} finally {
			// Reset the loading state regardless of success or failure
			isLoading = false;
		}
	}

	// 3. Copy to clipboard function
	let copiedName = null;
	let _copyTimeout = null;

	/**
	 * Copy text to the user's clipboard (client-side only).
	 * @param {string} text
	 */
	async function copyToClipboard(text) {
		if (!text) return false;
		if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
			console.warn('Clipboard API not available in this environment');
			return false;
		}

		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (err) {
			console.error('Failed to copy to clipboard', err);
			return false;
		}
	}

	// Handler used by the button to copy and show transient 'Copied' state
	async function handleCopy(name) {
		const ok = await copyToClipboard(name);
		if (!ok) return;

		copiedName = name;
		if (_copyTimeout) clearTimeout(_copyTimeout);
		_copyTimeout = setTimeout(() => {
			if (copiedName === name) copiedName = null;
			_copyTimeout = null;
		}, 2000);
	}
</script>

<main class="container">
	<h1>AI File Namer</h1>
	<p>
		Enter a description, and the AI will suggest 5 perfectly formatted
		filenames.
	</p>

	<form on:submit|preventDefault={handleSubmit}>
		<textarea
			bind:value={description}
			placeholder="e.g., List of employee names in my company"
			rows="4"
			disabled={isLoading}
			required
		></textarea>

		<button type="submit" disabled={isLoading || description.length === 0}>
			{#if isLoading}
				Generating...
			{:else}
				Generate Filenames
			{/if}
		</button>
	</form>

	{#if error}
		<div class="message error">
			Error: {error}
		</div>
	{/if}

	{#if generatedNames.length > 0}
		<div class="results">
			<h2>Suggested Names:</h2>
			<ul>
				{#each generatedNames as name (name)}
					<li>
						<span>{name}</span>
						<button
							on:click={() => handleCopy(name)}
							class:copied={copiedName === name}
						>
							<span class="copy-text">Copy</span>
							<span class="copied-text">Copied</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 600px;
		margin: 40px auto;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		background-color: #fff;
	}

	h1 {
		color: #300;
	}

	textarea {
		width: 100%;
		padding: 10px;
		margin-bottom: 20px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		resize: vertical;
	}

	button {
		background-color: #0f0f0f;
		color: white;
		padding: 10px 15px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	button:hover:not(:disabled) {
		background-color: #0fe7b4c4;
		color: #0f0f0f;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.message.error {
		background-color: #fdd;
		color: #a00;
		border: 1px solid #f99;
		padding: 10px;
		margin-top: 15px;
		border-radius: 4px;
	}

	.results {
		margin-top: 30px;
		padding-top: 15px;
		border-top: 1px solid #eee;
	}

	.results ul {
		list-style: none;
		padding: 0;
	}

	.results li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #f9f9f9;
		padding: 10px;
		margin-bottom: 8px;
		border-radius: 4px;
	}

	.results li span {
		font-family: monospace;
		font-size: 1.1em;
		color: #333;
	}

	.results li button {
		min-width: 84px;
		position: relative;
		overflow: hidden;
		padding: 8px 12px;
		border-radius: 4px;
		transition: background-color 160ms ease, transform 160ms ease;
		/* Make copy buttons neutral: transparent background and black text */
		background: transparent;
		color: #000;
		border: 1px solid rgba(0,0,0,0.08);
	}

	.results li button span {
		display: inline-block;
		transition: opacity 160ms ease, transform 160ms ease;
	}

	.results li button .copied-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) translateY(6px);
		opacity: 0;
	}

	.results li button .copy-text {
		opacity: 1;
		color: #0f0f0f;
		transform: translateY(0);
	}

	.results li button.copied .copied-text {
		opacity: 1;
		transform: translate(-50%, -50%) translateY(0);
	}

	.results li button.copied .copy-text {
		opacity: 0;
		transform: translateY(-6px);
	}

	/* Override global button hover for copy buttons */
	.results li button:hover:not(:disabled) {
		background: rgba(0,0,0,0.04);
	}
</style>
