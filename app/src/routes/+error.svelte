<script>
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · {page.error?.message ?? 'Что-то пошло не так'}</title>
</svelte:head>

<!--
	Intentionally plain HTML (no shadcn components): this file is a separate,
	lazily loaded chunk, and it must look identical to src/error.html, which
	cannot mount Svelte components at all. Keep the markup and tokens in sync.
-->
<main
	class="flex min-h-screen items-center justify-center bg-background p-6 text-foreground"
>
	<section
		class="w-full max-w-md rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm"
	>
		<div class="text-5xl leading-none font-light text-primary">{page.status}</div>
		<h1 class="mt-3 text-xl font-semibold">
			{page.error?.message ?? 'Что-то пошло не так'}
		</h1>
		<p class="mt-2 text-sm text-muted-foreground">
			Вернитесь на главную страницу и попробуйте снова.
		</p>
		<a
			href="/"
			class="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
		>
			На главную
		</a>
	</section>
</main>
