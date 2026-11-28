<script>
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import * as Field from '#lib/components/ui/field';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	let { form } = $props();
</script>

<svelte:head>
	<title>New medication</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/admin/meds" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to medications
	</Button>

	{#if form?.message}
		<Alert.Root variant="destructive">
			<ShieldAlertIcon />
			<Alert.Title>Could not create medication</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<form method="POST" class="flex flex-col gap-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>New medication</Card.Title>
				<Card.Description>
					The mark ID is entered manually and cannot be changed later.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Field.FieldGroup>
					<Field.Field>
						<Field.FieldLabel for="id">Mark ID (UUID)</Field.FieldLabel>
						<Input
							id="id"
							name="id"
							value={form?.values?.id ?? ''}
							placeholder="00000000-0000-0000-0000-000000000000"
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="name">Name</Field.FieldLabel>
						<Input id="name" name="name" value={form?.values?.name ?? ''} maxlength="50" required />
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="method">Method</Field.FieldLabel>
						<Input
							id="method"
							name="method"
							value={form?.values?.method ?? ''}
							maxlength="30"
							required
						/>
					</Field.Field>
				</Field.FieldGroup>
			</Card.Content>
			<Card.Footer class="justify-between">
				<Button href="/admin/meds" variant="ghost">Cancel</Button>
				<Button type="submit">Create medication</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
