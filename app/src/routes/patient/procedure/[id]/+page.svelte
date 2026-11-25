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
	<title>{data.procedure?.proc_name ?? 'Procedure details'}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/patient" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to procedures
	</Button>

	{#if data.procedure}
		<Card.Root>
			<Card.Header>
				<Card.Title>{data.procedure.proc_name}</Card.Title>
				<Card.Description>
					Procedure #{data.procedure.proc_id} · {formatDateTime(data.procedure.proc_time)}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Doctor</span>
						<span class="font-medium">{data.procedure.doc_fullname}</span>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Doctor phone</span>
						<span class="font-medium">{data.procedure.doc_phone}</span>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Recommendations</span>
						<span class="font-medium">{data.procedure.recommendations ?? '—'}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Applied medications</Card.Title>
			<Card.Description>Medicines recorded for this procedure.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">{medications.length} total</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if medications.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><PillIcon /></Empty.Media>
						<Empty.Title>No medications recorded</Empty.Title>
						<Empty.Description>
							This procedure does not have any medication applications.
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Caption>Medication applications for this procedure.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>Medicine</Table.Head>
							<Table.Head>Method</Table.Head>
							<Table.Head class="text-right">Dosage</Table.Head>
							<Table.Head>Mark ID</Table.Head>
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
