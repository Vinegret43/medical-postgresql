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
	<title>My procedures</title>
</svelte:head>

<Card.Root>
	<Card.Header>
		<Card.Title>My procedures</Card.Title>
		<Card.Description>Procedures recorded under your license.</Card.Description>
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
					<Empty.Description>
						Procedures you create will appear here.
					</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<Table.Root>
				<Table.Caption>Your recorded procedures.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head>Date</Table.Head>
						<Table.Head>Patient</Table.Head>
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
