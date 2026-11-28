<script>
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Table from '#lib/components/ui/table';
	import ConfirmDelete from '#lib/components/admin/ConfirmDelete.svelte';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { formatDateTime } from '#lib/format.js';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	let { data, form } = $props();
	let procedures = $derived(data.procedures ?? []);
</script>

<svelte:head>
	<title>Procedures</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if form?.message}
		<Alert.Root variant={form?.success ? 'default' : 'destructive'}>
			{#if form?.success}
				<CircleCheckIcon />
			{:else}
				<ShieldAlertIcon />
			{/if}
			<Alert.Title>{form.success ? 'Done' : 'Could not delete procedure'}</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Procedures</Card.Title>
			<Card.Description>
				Edit procedure notes and applications. Patient and doctor assignments are fixed.
			</Card.Description>
			<Card.Action>
				<Badge variant="secondary">{procedures.length} total</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if procedures.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><ActivityIcon /></Empty.Media>
						<Empty.Title>No procedures yet</Empty.Title>
						<Empty.Description>Procedures are created by doctors.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Date</Table.Head>
							<Table.Head>Patient</Table.Head>
							<Table.Head>Doctor</Table.Head>
							<Table.Head>Procedure</Table.Head>
							<Table.Head>Last edited</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each procedures as procedure (procedure.proc_id)}
							<Table.Row>
								<Table.Cell class="whitespace-nowrap">{formatDateTime(procedure.proc_time)}</Table.Cell>
								<Table.Cell>
									<Button
										href={`/admin/patients/${procedure.oms}`}
										variant="link"
										size="sm"
										class="h-auto p-0"
									>
										{procedure.patient_fullname}
									</Button>
								</Table.Cell>
								<Table.Cell>
									<Button
										href={`/admin/doctors/${procedure.license}`}
										variant="link"
										size="sm"
										class="h-auto p-0"
									>
										{procedure.doctor_fullname}
									</Button>
								</Table.Cell>
								<Table.Cell class="font-medium">{procedure.proc_name}</Table.Cell>
								<Table.Cell class="text-xs text-muted-foreground">
									{#if procedure.admin_login}
										{procedure.admin_login}<br />
										{formatDateTime(procedure.admin_edit_timestamp)}
									{:else}
										—
									{/if}
								</Table.Cell>
								<Table.Cell>
									<div class="flex justify-end gap-1">
										<Button
											href={`/admin/procedures/${procedure.proc_id}`}
											variant="link"
											size="sm"
										>
											Manage
										</Button>
										<ConfirmDelete
											action="?/delete"
											hidden={{ proc_id: procedure.proc_id }}
											label="Delete"
											title="Delete this procedure?"
											description="Its medication applications will be removed as well."
										/>
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
