<script>
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import PillIcon from '@lucide/svelte/icons/pill';

	let { data } = $props();
	let medications = $derived(data.medications ?? []);
</script>

<svelte:head>
	<title>Medications</title>
</svelte:head>

<Card.Root>
	<Card.Header>
		<Card.Title>Medication catalog</Card.Title>
		<Card.Description>Medicines that can be applied to a procedure.</Card.Description>
		<Card.Action>
			<Badge variant="secondary">{medications.length} total</Badge>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		{#if medications.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon"><PillIcon /></Empty.Media>
					<Empty.Title>No medications found</Empty.Title>
					<Empty.Description>The medication catalog is empty.</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<Table.Root>
				<Table.Caption>Recorded medications.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Method</Table.Head>
						<Table.Head>Mark ID</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each medications as medication (medication.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{medication.name}</Table.Cell>
							<Table.Cell>{medication.method}</Table.Cell>
							<Table.Cell class="max-w-96 truncate font-mono text-xs">{medication.id}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Content>
</Card.Root>
