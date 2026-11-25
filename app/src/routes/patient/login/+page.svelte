<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head><title>Patient login</title></svelte:head>

<main class="flex min-h-screen items-center justify-center p-4">
	<form method="POST" use:enhance class="flex w-full max-w-sm flex-col gap-3 rounded-lg border p-6">
		<h1 class="text-lg font-semibold">Patient login</h1>
		<label class="flex flex-col gap-1">
			OMS policy number
			<input
				class="rounded border px-2 py-1"
				name="identifier"
				inputmode="numeric"
				autocomplete="username"
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			TOTP code
			<input
				class="rounded border px-2 py-1"
				name="secret"
				inputmode="numeric"
				pattern={"[0-9]{6}"}
				autocomplete="one-time-code"
				required
			/>
		</label>
		{#if form?.message}<p class="text-sm text-red-600">{form.message}</p>{/if}
		<button class="rounded bg-black px-3 py-2 text-white" type="submit">Log in</button>
	</form>
</main>
