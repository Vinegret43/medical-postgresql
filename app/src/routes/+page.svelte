<script>
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card';

	const links = [
		{ label: 'Администратор', href: '/admin' },
		{ label: 'Врач', href: '/doc' },
		{ label: 'Пациент', href: '/patient' }
	];
</script>

<svelte:head>
	<title>Главная</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-sm">
		<CardHeader>
			<CardTitle>Выберите роль</CardTitle>
			<CardDescription>Выберите, как продолжить.</CardDescription>
		</CardHeader>
		<CardContent>
			{#each links as link (link.href)}
				<Button href={link.href} variant="outline" class="w-full">{link.label}</Button>
			{/each}
		</CardContent>
	</Card>
</main>
