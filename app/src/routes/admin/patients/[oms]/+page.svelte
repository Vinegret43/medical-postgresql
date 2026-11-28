<script>
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import * as Empty from '#lib/components/ui/empty';
	import * as Table from '#lib/components/ui/table';
	import ConfirmDelete from '#lib/components/admin/ConfirmDelete.svelte';
	import InlineEdit from '#lib/components/admin/InlineEdit.svelte';
	import TotpCard from '#lib/components/admin/TotpCard.svelte';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { formatDate, formatDateTime } from '#lib/format.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	let { data, form } = $props();

	let procedures = $derived(data.procedures ?? []);
	let handoff = $derived(form?.handoff ?? data.totp ?? null);

	function fieldError(field) {
		return form?.field === field ? form.message : null;
	}
</script>

<svelte:head>
	<title>{data.patient.fullname}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/admin/patients" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to patients
	</Button>

	{#if form?.message && !form?.field}
		<Alert.Root variant={form?.success ? 'default' : 'destructive'}>
			{#if !form?.success}
				<ShieldAlertIcon />
			{/if}
			<Alert.Title>{form?.success ? 'Secret regenerated' : 'Could not save the change'}</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>{data.patient.fullname}</Card.Title>
			<Card.Description>Patient record and visit history.</Card.Description>
			<Card.Action>
				<ConfirmDelete
					hidden={{ oms: data.patient.oms }}
					label="Delete"
					title="Delete this patient?"
					description="Patients with procedures cannot be deleted until those procedures are removed."
				/>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-1">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">OMS</span>
					<span class="font-mono font-medium">{data.patient.oms}</span>
					<span class="text-xs text-muted-foreground">This identifier is immutable.</span>
				</div>
				<InlineEdit
					label="Full name"
					name="fullname"
					value={data.patient.fullname}
					maxlength="70"
					required
					error={fieldError('fullname')}
				/>
				<InlineEdit
					label="Date of birth"
					name="birthdate"
					type="date"
					value={data.patient.birthdate}
					required
					error={fieldError('birthdate')}
				/>
				<InlineEdit
					label="Phone"
					name="phone"
					value={data.patient.phone}
					required
					error={fieldError('phone')}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<TotpCard {handoff} subjectType="patient" />

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
					<Table.Header>
						<Table.Row>
							<Table.Head>Date</Table.Head>
							<Table.Head>Doctor</Table.Head>
							<Table.Head>Procedure</Table.Head>
							<Table.Head class="text-right">Details</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each procedures as procedure (procedure.proc_id)}
							<Table.Row>
								<Table.Cell class="whitespace-nowrap">{formatDateTime(procedure.proc_time)}</Table.Cell>
								<Table.Cell>{procedure.doctor_fullname}</Table.Cell>
								<Table.Cell class="font-medium">{procedure.proc_name}</Table.Cell>
								<Table.Cell class="text-right">
									<Button
										href={`/admin/procedures/${procedure.proc_id}`}
										variant="link"
										size="sm"
									>
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
