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
		<Card.Title>Medical procedures</Card.Title>
		<Card.Description>
			Your visit history. Open a procedure to see the medications that were applied.
		</Card.Description>
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
						Your procedures will appear here once they are recorded.
					</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<Table.Root>
				<Table.Caption>A list of your recorded procedures.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head>Date</Table.Head>
						<Table.Head>Procedure</Table.Head>
						<Table.Head>Doctor</Table.Head>
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
							<Table.Cell class="font-medium">{procedure.proc_name}</Table.Cell>
							<Table.Cell>
								<div class="flex flex-col gap-0.5">
									<span>{procedure.doc_fullname}</span>
									<span class="text-xs text-muted-foreground">{procedure.doc_phone}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="max-w-64 truncate text-muted-foreground">
								{procedure.recommendations ?? '—'}
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button href={`/patient/procedure/${procedure.proc_id}`} variant="link" size="sm">
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
