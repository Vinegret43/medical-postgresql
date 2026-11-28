<script>
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { formatDate, formatDateTime } from '#lib/format.js';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { data } = $props();
	let procedures = $derived(data.procedures ?? []);
</script>

<svelte:head>
	<title>{data.patient.fullname}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>{data.patient.fullname}</Card.Title>
			<Card.Description>Данные пациента и история посещений.</Card.Description>
			<Card.Action>
				<Button href={`/doc/new?oms=${data.patient.oms}`} size="sm">
					<PlusIcon data-icon="inline-start" />
					Новая процедура
				</Button>
			</Card.Action>
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
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Процедуры</Card.Title>
			<Card.Description>Все процедуры, записанные для этого пациента.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">Всего: {procedures.length}</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if procedures.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><ClipboardListIcon /></Empty.Media>
						<Empty.Title>Процедур пока нет</Empty.Title>
						<Empty.Description>У этого пациента нет записанных процедур.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Caption>Записанные процедуры.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>Дата</Table.Head>
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
								<Table.Cell>{procedure.doc_fullname}</Table.Cell>
								<Table.Cell class="font-medium">{procedure.proc_name}</Table.Cell>
								<Table.Cell class="max-w-48 truncate text-muted-foreground">
									{procedure.remarks ?? '—'}
								</Table.Cell>
								<Table.Cell class="max-w-48 truncate text-muted-foreground">
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
</div>
