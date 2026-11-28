<script>
	import { goto } from '$app/navigation';
	import { onDestroy, untrack } from 'svelte';
	import * as ButtonGroup from '#lib/components/ui/button-group';
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Field from '#lib/components/ui/field';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { formatDate } from '#lib/format.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';

	let { data } = $props();
	let q = $state(untrack(() => data.q ?? ''));
	let patients = $derived(data.patients ?? []);
	let searchTimer;

	function scheduleSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			const query = q.trim();
			const target = query ? `/admin/patients?q=${encodeURIComponent(query)}` : '/admin/patients';
			try {
				await goto(target, { replace: true, reset: false });
			} catch {
				// A newer keystroke cancelled this navigation.
			}
		}, 250);
	}

	onDestroy(() => clearTimeout(searchTimer));
</script>

<svelte:head>
	<title>Patients</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Find a patient</Card.Title>
			<Card.Description>Search by OMS policy number or name.</Card.Description>
			<Card.Action>
				<Button href="/admin/patients/new" size="sm">
					<PlusIcon data-icon="inline-start" />
					New patient
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<form method="GET" action="/admin/patients">
				<Field.Field>
					<Field.FieldLabel for="q">OMS or name</Field.FieldLabel>
					<ButtonGroup.Root class="w-full" aria-label="Patient search">
						<Input
							id="q"
							name="q"
							bind:value={q}
							oninput={scheduleSearch}
							placeholder="e.g. Ivan or 2000000001"
						/>
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
			<Card.Description>Open a record to edit it or view its sign-in code.</Card.Description>
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
									<Button href={`/admin/patients/${patient.oms}`} variant="link" size="sm">
										Manage
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
