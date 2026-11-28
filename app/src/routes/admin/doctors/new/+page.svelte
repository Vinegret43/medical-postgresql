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
	<title>Новый врач</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/admin/doctors" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		К врачам
	</Button>

	{#if form?.message}
		<Alert.Root variant="destructive">
			<ShieldAlertIcon />
			<Alert.Title>Не удалось создать врача</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<form method="POST" class="flex flex-col gap-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>Новый врач</Card.Title>
				<Card.Description>
					Код для входа создаётся автоматически. Вы можете передать его врачу со страницы записи.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Field.FieldGroup>
					<Field.Field>
						<Field.FieldLabel for="license">Номер лицензии</Field.FieldLabel>
						<Input
							id="license"
							name="license"
							value={form?.values?.license ?? ''}
							inputmode="numeric"
							placeholder="1000000001"
							required
						/>
						<Field.FieldDescription>Этот идентификатор нельзя изменить.</Field.FieldDescription>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="fullname">ФИО</Field.FieldLabel>
						<Input
							id="fullname"
							name="fullname"
							value={form?.values?.fullname ?? ''}
							maxlength="70"
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="birthdate">Дата рождения</Field.FieldLabel>
						<Input
							id="birthdate"
							name="birthdate"
							type="date"
							value={form?.values?.birthdate ?? ''}
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="phone">Телефон</Field.FieldLabel>
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
				<Button href="/admin/doctors" variant="ghost">Отмена</Button>
				<Button type="submit">Создать врача</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
