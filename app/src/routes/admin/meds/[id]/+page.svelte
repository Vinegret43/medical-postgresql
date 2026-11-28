<script>
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import ConfirmDelete from '#lib/components/admin/ConfirmDelete.svelte';
	import InlineEdit from '#lib/components/admin/InlineEdit.svelte';
	import { Button } from '#lib/components/ui/button';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	let { data, form } = $props();

	function fieldError(field) {
		return form?.field === field ? form.message : null;
	}
</script>

<svelte:head>
	<title>{data.medication.name}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/admin/meds" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to medications
	</Button>

	{#if form?.message && !form?.field}
		<Alert.Root variant="destructive">
			<ShieldAlertIcon />
			<Alert.Title>Could not save the change</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>{data.medication.name}</Card.Title>
			<Card.Description>Medication record and catalog details.</Card.Description>
			<Card.Action>
				<ConfirmDelete
					hidden={{ id: data.medication.id }}
					label="Delete"
					title="Delete this medication?"
					description="Medications still used by applications cannot be deleted."
				/>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">Mark ID</span>
					<code class="break-all font-mono text-sm">{data.medication.id}</code>
					<span class="text-xs text-muted-foreground">This identifier is immutable.</span>
				</div>
				<InlineEdit
					label="Name"
					name="name"
					value={data.medication.name}
					maxlength="50"
					required
					error={fieldError('name')}
				/>
				<InlineEdit
					label="Method"
					name="method"
					value={data.medication.method}
					maxlength="30"
					required
					error={fieldError('method')}
				/>
			</div>
		</Card.Content>
	</Card.Root>
</div>
