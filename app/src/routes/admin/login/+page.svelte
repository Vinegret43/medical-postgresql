<script>
	import { enhance } from '$app/forms';
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import * as Field from '#lib/components/ui/field';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	let { form } = $props();
</script>

<svelte:head><title>Вход для администратора</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
	<form method="POST" use:enhance class="w-full max-w-md">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title>Вход для администратора</Card.Title>
				<Card.Description>Войдите, используя логин и пароль администратора.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Field.FieldGroup class="gap-4">
					<Field.Field>
						<Field.FieldLabel for="identifier">Логин</Field.FieldLabel>
						<Input
							id="identifier"
							name="identifier"
							autocomplete="username"
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="secret">Пароль</Field.FieldLabel>
						<Input
							id="secret"
							name="secret"
							type="password"
							autocomplete="current-password"
							required
						/>
					</Field.Field>
				</Field.FieldGroup>

				{#if form?.message}
					<Alert.Root variant="destructive" class="mt-4">
						<ShieldAlertIcon />
						<Alert.Title>Ошибка входа</Alert.Title>
						<Alert.Description>{form.message}</Alert.Description>
					</Alert.Root>
				{/if}
			</Card.Content>
			<Card.Footer class="flex-col gap-3">
				<Button type="submit" class="w-full">Войти</Button>
				<Button href="/" variant="ghost" size="sm">К выбору роли</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</main>
