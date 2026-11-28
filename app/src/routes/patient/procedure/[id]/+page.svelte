<script>
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { formatDateTime } from '#lib/format.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import PillIcon from '@lucide/svelte/icons/pill';

	let { data } = $props();
	let medications = $derived(data.medications ?? []);
</script>

<svelte:head>
	<title>{data.procedure?.proc_name ?? 'Детали процедуры'}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/patient" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		К процедурам
	</Button>

	{#if data.procedure}
		<Card.Root>
			<Card.Header>
				<Card.Title>{data.procedure.proc_name}</Card.Title>
				<Card.Description>
					Процедура №{data.procedure.proc_id} · {formatDateTime(data.procedure.proc_time)}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Врач</span>
						<span class="font-medium">{data.procedure.doc_fullname}</span>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Телефон врача</span>
						<span class="font-medium">{data.procedure.doc_phone}</span>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Рекомендации</span>
						<span class="font-medium">{data.procedure.recommendations ?? '—'}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Применённые препараты</Card.Title>
			<Card.Description>Препараты, записанные для этой процедуры.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">Всего: {medications.length}</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if medications.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><PillIcon /></Empty.Media>
						<Empty.Title>Препараты не записаны</Empty.Title>
						<Empty.Description>
							К этой процедуре не добавлены назначения.
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Caption>Назначения препаратов для этой процедуры.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>Препарат</Table.Head>
							<Table.Head>Способ применения</Table.Head>
							<Table.Head class="text-right">Дозировка</Table.Head>
							<Table.Head>Идентификатор знака</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each medications as medication (medication.med_id)}
							<Table.Row>
								<Table.Cell class="font-medium">{medication.med_name}</Table.Cell>
								<Table.Cell>{medication.med_method}</Table.Cell>
								<Table.Cell class="text-right">{medication.dosage}</Table.Cell>
								<Table.Cell class="max-w-64 truncate font-mono text-xs">
									{medication.med_id}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
