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
		К препаратам
	</Button>

	{#if form?.message && !form?.field}
		<Alert.Root variant="destructive">
			<ShieldAlertIcon />
			<Alert.Title>Не удалось сохранить изменение</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>{data.medication.name}</Card.Title>
			<Card.Description>Данные препарата и сведения из каталога.</Card.Description>
			<Card.Action>
				<ConfirmDelete
					hidden={{ id: data.medication.id }}
					label="Удалить"
					title="Удалить этот препарат?"
					description="Препараты, используемые в назначениях, нельзя удалить."
				/>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">Идентификатор знака</span>
					<code class="break-all font-mono text-sm">{data.medication.id}</code>
					<span class="text-xs text-muted-foreground">Этот идентификатор нельзя изменить.</span>
				</div>
				<InlineEdit
					label="Название"
					name="name"
					value={data.medication.name}
					maxlength="50"
					required
					error={fieldError('name')}
				/>
				<InlineEdit
					label="Способ применения"
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
