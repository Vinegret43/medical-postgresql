<script>
	import { goto } from '$app/navigation';
	import { onDestroy, untrack } from 'svelte';
	import * as ButtonGroup from '#lib/components/ui/button-group';
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Field from '#lib/components/ui/field';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { formatDate } from '#lib/format.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';

	let { data } = $props();
	let q = $state(untrack(() => data.q ?? ''));
	let patients = $derived(data.patients ?? []);
	let searchTimer;

	function scheduleSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			const query = q.trim();
			const target = query ? `/doc/patients?q=${encodeURIComponent(query)}` : '/doc/patients';

			try {
				// Same route, new query: SvelteKit re-runs the page load without a full reload.
				await goto(target, { replace: true, reset: false });
			} catch(err) {
				// A newer keystroke cancelled this navigation; its own timer will reload.
			}
		}, 250);
	}

	onDestroy(() => clearTimeout(searchTimer));
</script>

<svelte:head>
	<title>Пациенты</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Найти пациента</Card.Title>
			<Card.Description>Поиск по номеру полиса ОМС или ФИО. Результаты обновляются по мере ввода.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="GET" action="/doc/patients">
				<Field.Field>
					<Field.FieldLabel for="q">ОМС или ФИО</Field.FieldLabel>
					<ButtonGroup.Root class="w-full" aria-label="Поиск пациента">
						<Input
							id="q"
							name="q"
							bind:value={q}
							oninput={scheduleSearch}
							placeholder="например, Иванов или 2000000001"
						/>
						<Button type="submit" variant="outline">
							<SearchIcon data-icon="inline-start" />
							Найти
						</Button>
					</ButtonGroup.Root>
				</Field.Field>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Пациенты</Card.Title>
			<Card.Description>Откройте пациента, чтобы увидеть его данные и процедуры.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">Показано: {patients.length}</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if patients.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><UserRoundIcon /></Empty.Media>
						<Empty.Title>Пациенты не найдены</Empty.Title>
						<Empty.Description>Попробуйте другой номер ОМС или ФИО.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Caption>Данные пациентов.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>ОМС</Table.Head>
							<Table.Head>ФИО</Table.Head>
							<Table.Head>Дата рождения</Table.Head>
							<Table.Head>Телефон</Table.Head>
							<Table.Head class="text-right">Действия</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each patients as patient (patient.oms)}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{patient.oms}</Table.Cell>
								<Table.Cell class="font-medium">{patient.fullname}</Table.Cell>
								<Table.Cell>{formatDate(patient.birthdate)}</Table.Cell>
								<Table.Cell>{patient.phone}</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex justify-end gap-1">
										<Button href={`/doc/patients/${patient.oms}`} variant="link" size="sm">
											Просмотр
										</Button>
										<Button href={`/doc/new?oms=${patient.oms}`} variant="link" size="sm">
											Новая процедура
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
