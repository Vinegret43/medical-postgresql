<script>
	import * as ButtonGroup from '#lib/components/ui/button-group';
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Field from '#lib/components/ui/field';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { formatDate } from '#lib/format.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';

	let { data } = $props();
	let patients = $derived(data.patients ?? []);
</script>

<svelte:head>
	<title>Patients</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Find a patient</Card.Title>
			<Card.Description>Search by OMS policy number or name.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="GET" action="/doc/patients">
				<Field.Field>
					<Field.FieldLabel for="q">OMS or name</Field.FieldLabel>
					<ButtonGroup.Root class="w-full" aria-label="Patient search">
						<Input id="q" name="q" value={data.q ?? ''} placeholder="e.g. Ivan or 2000000001" />
						<Button type="submit" variant="outline">
							<SearchIcon data-icon="inline-start" />
							Search
						</Button>
					</ButtonGroup.Root>
				</Field.Field>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Patients</Card.Title>
			<Card.Description>Open a patient to see their data and procedures.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">{patients.length} shown</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if patients.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><UserRoundIcon /></Empty.Media>
						<Empty.Title>No patients found</Empty.Title>
						<Empty.Description>Try a different OMS number or name.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Caption>Patient records.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>OMS</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>Date of birth</Table.Head>
							<Table.Head>Phone</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each patients as patient (patient.oms)}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{patient.oms}</Table.Cell>
								<Table.Cell class="font-medium">{patient.fullname}</Table.Cell>
								<Table.Cell>{formatDate(patient.birthdate)}</Table.Cell>
								<Table.Cell>{patient.phone}</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex justify-end gap-1">
										<Button href={`/doc/patients/${patient.oms}`} variant="link" size="sm">
											View
										</Button>
										<Button href={`/doc/new?oms=${patient.oms}`} variant="link" size="sm">
											New procedure
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
