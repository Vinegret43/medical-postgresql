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
	<title>Новый препарат</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/admin/meds" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		К препаратам
	</Button>

	{#if form?.message}
		<Alert.Root variant="destructive">
			<ShieldAlertIcon />
			<Alert.Title>Не удалось создать препарат</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<form method="POST" class="flex flex-col gap-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>Новый препарат</Card.Title>
				<Card.Description>
					Идентификатор «честного знака» вводится вручную и не может быть изменён позже.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Field.FieldGroup>
					<Field.Field>
						<Field.FieldLabel for="id">Идентификатор «честного знака» (UUID)</Field.FieldLabel>
						<Input
							id="id"
							name="id"
							value={form?.values?.id ?? ''}
							placeholder="00000000-0000-0000-0000-000000000000"
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="name">Название</Field.FieldLabel>
						<Input id="name" name="name" value={form?.values?.name ?? ''} maxlength="50" required />
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="method">Способ применения</Field.FieldLabel>
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
				<Button href="/admin/meds" variant="ghost">Отмена</Button>
				<Button type="submit">Создать препарат</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
