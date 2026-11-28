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
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';

	let { data } = $props();
	let q = $state(untrack(() => data.q ?? ''));
	let doctors = $derived(data.doctors ?? []);
	let searchTimer;

	function scheduleSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			const query = q.trim();
			const target = query ? `/admin/doctors?q=${encodeURIComponent(query)}` : '/admin/doctors';
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
	<title>Doctors</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Find a doctor</Card.Title>
			<Card.Description>Search by license number or name.</Card.Description>
			<Card.Action>
				<Button href="/admin/doctors/new" size="sm">
					<PlusIcon data-icon="inline-start" />
					New doctor
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<form method="GET" action="/admin/doctors">
				<Field.Field>
					<Field.FieldLabel for="q">License or name</Field.FieldLabel>
					<ButtonGroup.Root class="w-full" aria-label="Doctor search">
						<Input
							id="q"
							name="q"
							bind:value={q}
							oninput={scheduleSearch}
							placeholder="e.g. Maria or 1000000001"
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
			<Card.Title>Doctors</Card.Title>
			<Card.Description>Open a record to edit it or view its sign-in code.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">{doctors.length} shown</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if doctors.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><StethoscopeIcon /></Empty.Media>
						<Empty.Title>No doctors found</Empty.Title>
						<Empty.Description>Try a different license number or name.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>License</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>Date of birth</Table.Head>
							<Table.Head>Phone</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each doctors as doctor (doctor.license)}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{doctor.license}</Table.Cell>
								<Table.Cell class="font-medium">{doctor.fullname}</Table.Cell>
								<Table.Cell>{formatDate(doctor.birthdate)}</Table.Cell>
								<Table.Cell>{doctor.phone}</Table.Cell>
								<Table.Cell class="text-right">
									<Button href={`/admin/doctors/${doctor.license}`} variant="link" size="sm">
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
