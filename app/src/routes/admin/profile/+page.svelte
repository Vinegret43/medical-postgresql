<script>
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import { Button } from '#lib/components/ui/button';
	import { formatDate } from '#lib/format.js';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ShieldIcon from '@lucide/svelte/icons/shield';

	let { data } = $props();
</script>

<svelte:head>
	<title>Мой профиль</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if data.admin}
		<Card.Root class="mx-auto w-full max-w-2xl">
			<Card.Header>
				<Card.Title>{data.admin.fullname}</Card.Title>
				<Card.Description>Ваша учётная запись администратора в медицинском сервисе.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Логин</span>
						<span class="font-medium">{data.admin.login}</span>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Дата рождения</span>
						<span class="font-medium">{formatDate(data.admin.birthdate)}</span>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Телефон</span>
						<span class="font-medium">{data.admin.phone}</span>
					</div>
				</div>
			</Card.Content>
			<Card.Footer>
				<form method="POST" action="/logout">
					<Button type="submit" variant="destructive">
						<LogOutIcon data-icon="inline-start" />
						Выйти
					</Button>
				</form>
			</Card.Footer>
		</Card.Root>
	{:else}
		<Empty.Root class="mx-auto w-full max-w-2xl">
			<Empty.Header>
				<Empty.Media variant="icon"><ShieldIcon /></Empty.Media>
				<Empty.Title>Запись профиля не найдена</Empty.Title>
				<Empty.Description>
					Администратор с логином {data.login} не найден. Попросите другого администратора добавить его.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<form method="POST" action="/logout">
					<Button type="submit" variant="outline">
						<LogOutIcon data-icon="inline-start" />
						Выйти
					</Button>
				</form>
			</Empty.Content>
		</Empty.Root>
	{/if}
</div>
