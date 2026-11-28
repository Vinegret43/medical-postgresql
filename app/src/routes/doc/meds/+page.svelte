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
	<title>Лекарства</title>
</svelte:head>

<Card.Root>
	<Card.Header>
		<Card.Title>Каталог лекарств</Card.Title>
		<Card.Description>Препараты, которые можно назначить в процедуре.</Card.Description>
		<Card.Action>
			<Badge variant="secondary">Всего: {medications.length}</Badge>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		{#if medications.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon"><PillIcon /></Empty.Media>
					<Empty.Title>Лекарства не найдены</Empty.Title>
					<Empty.Description>Каталог лекарств пуст.</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<Table.Root>
				<Table.Caption>Записанные препараты.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head>Название</Table.Head>
						<Table.Head>Способ применения</Table.Head>
						<Table.Head>Идентификатор знака</Table.Head>
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
