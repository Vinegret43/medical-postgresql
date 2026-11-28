<script>
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import PillIcon from '@lucide/svelte/icons/pill';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { data } = $props();
	let medications = $derived(data.medications ?? []);
</script>

<svelte:head>
	<title>Лекарства</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Каталог лекарств</Card.Title>
			<Card.Description>
				У каждого лекарства есть введённый вручную UUID «честного знака».
			</Card.Description>
			<Card.Action>
				<Button href="/admin/meds/new" size="sm">
					<PlusIcon data-icon="inline-start" />
					Новый препарат
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if medications.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><PillIcon /></Empty.Media>
						<Empty.Title>Препаратов пока нет</Empty.Title>
						<Empty.Description>Добавьте первый препарат в каталог.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Caption>Данные препаратов.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>Идентификатор знака</Table.Head>
							<Table.Head>Название</Table.Head>
							<Table.Head>Способ применения</Table.Head>
							<Table.Head class="text-right">Действия</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each medications as medication (medication.id)}
							<Table.Row>
								<Table.Cell class="max-w-72 truncate font-mono text-xs">
									{medication.id}
								</Table.Cell>
								<Table.Cell class="font-medium">{medication.name}</Table.Cell>
								<Table.Cell>
									<Badge variant="secondary">{medication.method}</Badge>
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button href={`/admin/meds/${medication.id}`} variant="link" size="sm">
										Изменить
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
