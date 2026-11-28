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
	<title>New doctor</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/admin/doctors" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to doctors
	</Button>

	{#if form?.message}
		<Alert.Root variant="destructive">
			<ShieldAlertIcon />
			<Alert.Title>Could not create doctor</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<form method="POST" class="flex flex-col gap-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>New doctor</Card.Title>
				<Card.Description>
					A sign-in code is generated automatically. You can hand it to the doctor from the
					record page.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Field.FieldGroup>
					<Field.Field>
						<Field.FieldLabel for="license">License number</Field.FieldLabel>
						<Input
							id="license"
							name="license"
							value={form?.values?.license ?? ''}
							inputmode="numeric"
							placeholder="1000000001"
							required
						/>
						<Field.FieldDescription>This identifier is immutable.</Field.FieldDescription>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="fullname">Full name</Field.FieldLabel>
						<Input
							id="fullname"
							name="fullname"
							value={form?.values?.fullname ?? ''}
							maxlength="70"
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="birthdate">Date of birth</Field.FieldLabel>
						<Input
							id="birthdate"
							name="birthdate"
							type="date"
							value={form?.values?.birthdate ?? ''}
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="phone">Phone</Field.FieldLabel>
						<Input
							id="phone"
							name="phone"
							value={form?.values?.phone ?? ''}
							placeholder="+79997654321"
							required
						/>
					</Field.Field>
				</Field.FieldGroup>
			</Card.Content>
			<Card.Footer class="justify-between">
				<Button href="/admin/doctors" variant="ghost">Cancel</Button>
				<Button type="submit">Create doctor</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
