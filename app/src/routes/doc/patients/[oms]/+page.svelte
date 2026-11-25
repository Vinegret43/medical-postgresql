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
			<Card.Description>Patient record and visit history.</Card.Description>
			<Card.Action>
				<Button href={`/doc/new?oms=${data.patient.oms}`} size="sm">
					<PlusIcon data-icon="inline-start" />
					New procedure
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-1">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">OMS policy number</span>
					<span class="font-medium">{data.patient.oms}</span>
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">Date of birth</span>
					<span class="font-medium">{formatDate(data.patient.birthdate)}</span>
				</div>
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">Phone</span>
					<span class="font-medium">{data.patient.phone}</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Procedures</Card.Title>
			<Card.Description>All procedures recorded for this patient.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">{procedures.length} total</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if procedures.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><ClipboardListIcon /></Empty.Media>
						<Empty.Title>No procedures yet</Empty.Title>
						<Empty.Description>This patient has no recorded procedures.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Caption>Recorded procedures.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>Date</Table.Head>
							<Table.Head>Doctor</Table.Head>
							<Table.Head>Procedure</Table.Head>
							<Table.Head>Remarks</Table.Head>
							<Table.Head>Recommendations</Table.Head>
							<Table.Head class="text-right">Details</Table.Head>
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
										View
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
