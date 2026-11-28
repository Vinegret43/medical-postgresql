<script>
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { formatDateTime } from '#lib/format.js';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';

	let { data } = $props();
	let procedures = $derived(data.procedures ?? []);
</script>

<svelte:head>
	<title>Все процедуры</title>
</svelte:head>

<Card.Root>
	<Card.Header>
		<Card.Title>Все процедуры</Card.Title>
		<Card.Description>Все процедуры, записанные в сервисе.</Card.Description>
		<Card.Action>
			<Badge variant="secondary">Всего: {procedures.length}</Badge>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		{#if procedures.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon"><ClipboardListIcon /></Empty.Media>
					<Empty.Title>Процедуры не записаны</Empty.Title>
					<Empty.Description>В базе данных пока нет процедур.</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<Table.Root>
				<Table.Caption>Все записанные процедуры.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head>Дата</Table.Head>
						<Table.Head>Пациент</Table.Head>
						<Table.Head>Врач</Table.Head>
						<Table.Head>Процедура</Table.Head>
						<Table.Head>Замечания</Table.Head>
						<Table.Head>Рекомендации</Table.Head>
						<Table.Head class="text-right">Подробнее</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each procedures as procedure (procedure.proc_id)}
						<Table.Row>
							<Table.Cell class="whitespace-nowrap">
								{formatDateTime(procedure.proc_time)}
							</Table.Cell>
							<Table.Cell>
								<Button
									href={`/doc/patients/${procedure.oms}`}
									variant="link"
									size="sm"
									class="h-auto p-0"
								>
									{procedure.patient_fullname ?? procedure.oms}
								</Button>
							</Table.Cell>
							<Table.Cell>{procedure.doctor_fullname ?? procedure.license}</Table.Cell>
							<Table.Cell class="font-medium">{procedure.proc_name}</Table.Cell>
							<Table.Cell class="max-w-40 truncate text-muted-foreground">
								{procedure.remarks ?? '—'}
							</Table.Cell>
							<Table.Cell class="max-w-40 truncate text-muted-foreground">
								{procedure.recommendations ?? '—'}
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button href={`/doc/procedure/${procedure.proc_id}`} variant="link" size="sm">
									Просмотр
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Content>
</Card.Root>
