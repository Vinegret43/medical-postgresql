<script>
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import { Button } from '#lib/components/ui/button';
	import { formatDate } from '#lib/format.js';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';

	let { data } = $props();
</script>

<svelte:head>
	<title>Мой профиль</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if data.patient}
		<Card.Root class="mx-auto w-full max-w-2xl">
			<Card.Header>
				<Card.Title>{data.patient.fullname}</Card.Title>
				<Card.Description>Ваши личные данные в медицинском сервисе.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Номер полиса ОМС</span>
						<span class="font-medium">{data.patient.oms}</span>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Дата рождения</span>
						<span class="font-medium">{formatDate(data.patient.birthdate)}</span>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Телефон</span>
						<span class="font-medium">{data.patient.phone}</span>
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
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon"><UserRoundIcon /></Empty.Media>
				<Empty.Title>Запись профиля не найдена</Empty.Title>
				<Empty.Description>
					Пациент с полисом ОМС {data.oms} не найден. Попросите администратора добавить его.
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
