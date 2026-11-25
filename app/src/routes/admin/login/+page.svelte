<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head><title>Admin login</title></svelte:head>

<main class="flex min-h-screen items-center justify-center p-4">
	<form method="POST" use:enhance class="flex w-full max-w-sm flex-col gap-3 rounded-lg border p-6">
		<h1 class="text-lg font-semibold">Admin login</h1>
		<label class="flex flex-col gap-1">
			Login
			<input
				class="rounded border px-2 py-1"
				name="identifier"
				autocomplete="username"
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			Password
			<input
				class="rounded border px-2 py-1"
				name="secret"
				type="password"
				autocomplete="current-password"
				required
			/>
		</label>
		{#if form?.message}<p class="text-sm text-red-600">{form.message}</p>{/if}
		<button class="rounded bg-black px-3 py-2 text-white" type="submit">Log in</button>
	</form>
</main>
