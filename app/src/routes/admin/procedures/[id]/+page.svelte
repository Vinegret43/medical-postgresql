<script>
	import { untrack } from 'svelte';
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import * as Command from '#lib/components/ui/command';
	import * as Empty from '#lib/components/ui/empty';
	import * as Field from '#lib/components/ui/field';
	import * as Popover from '#lib/components/ui/popover';
	import * as Table from '#lib/components/ui/table';
	import ConfirmDelete from '#lib/components/admin/ConfirmDelete.svelte';
	import InlineEdit from '#lib/components/admin/InlineEdit.svelte';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { formatDateTime } from '#lib/format.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PillIcon from '@lucide/svelte/icons/pill';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	let { data, form } = $props();

	let applications = $derived(data.applications ?? []);
	let appliedIds = $derived(new Set(applications.map((application) => application.med_id)));
	let availableMedications = $derived(
		(data.medications ?? []).filter((medication) => !appliedIds.has(medication.id))
	);

	let medOpen = $state(false);
	let selectedMedId = $state(untrack(() => form?.values?.med_id ?? ''));
	let selectedDosage = $state(untrack(() => form?.values?.dosage ?? ''));

	let selectedMed = $derived(
		availableMedications.find((medication) => medication.id === selectedMedId) ?? null
	);
	let addError = $derived(form?.values?.med_id ? form?.message ?? null : null);

	function fieldError(field) {
		return form?.field === field ? form.message : null;
	}
</script>

<svelte:head>
	<title>{data.procedure.proc_name}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/admin/procedures" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		К процедурам
	</Button>

	{#if form?.message && !form?.field && !form?.values?.med_id}
		<Alert.Root variant={form?.success ? 'default' : 'destructive'}>
			{#if form?.success}
				<CircleCheckIcon />
			{:else}
				<ShieldAlertIcon />
			{/if}
			<Alert.Title>{form.success ? 'Готово' : 'Не удалось сохранить изменение'}</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>{data.procedure.proc_name}</Card.Title>
			<Card.Description>
				Процедура №{data.procedure.proc_id} · {formatDateTime(data.procedure.proc_time)}
			</Card.Description>
			<Card.Action>
				<div class="flex flex-wrap gap-2">
					<ConfirmDelete
						action="?/deleteProcedure"
						label="Удалить"
						title="Удалить эту процедуру?"
						description="Все назначения препаратов будут удалены."
					/>
				</div>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-1">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">Пациент</span>
					<Button
						href={`/admin/patients/${data.procedure.oms}`}
						variant="link"
						size="sm"
						class="h-auto justify-start p-0"
					>
						{data.procedure.patient_fullname}
					</Button>
					<span class="text-xs text-muted-foreground">ОМС {data.procedure.oms} · нельзя изменить</span>
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-xs tracking-wide text-muted-foreground uppercase">Врач</span>
					<Button
						href={`/admin/doctors/${data.procedure.license}`}
						variant="link"
						size="sm"
						class="h-auto justify-start p-0"
					>
						{data.procedure.doctor_fullname}
					</Button>
					<span class="text-xs text-muted-foreground">
						Лицензия {data.procedure.license} · нельзя изменить
					</span>
				</div>
				<InlineEdit
					label="Название процедуры"
					name="proc_name"
					value={data.procedure.proc_name}
					maxlength="200"
					required
					error={fieldError('proc_name')}
				/>
				<InlineEdit
					label="Время процедуры (МСК)"
					name="proc_time"
					type="datetime-local"
					value={data.procedure.proc_time}
					required
					error={fieldError('proc_time')}
				/>
				<InlineEdit
					label="Замечания"
					name="remarks"
					type="textarea"
					value={data.procedure.remarks}
					nullable
					error={fieldError('remarks')}
				/>
				<InlineEdit
					label="Рекомендации"
					name="recommendations"
					type="textarea"
					value={data.procedure.recommendations}
					nullable
					error={fieldError('recommendations')}
				/>
				{#if data.procedure.admin_login}
					<div class="flex flex-col gap-1 sm:col-span-2">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Последнее изменение</span>
						<span class="font-medium">
							{data.procedure.admin_login} · {formatDateTime(data.procedure.admin_edit_timestamp)}
						</span>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Добавить препарат</Card.Title>
			<Card.Description>
				Добавить один и тот же препарат повторно нельзя — измените существующую дозировку.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/addApplication" class="flex flex-col gap-3">
				<Field.FieldGroup class="gap-3 sm:flex-row sm:items-end">
					<Field.Field class="flex-1" data-invalid={Boolean(addError)}>
						<Field.FieldLabel for="medication-picker">Препарат</Field.FieldLabel>
						<Popover.Root bind:open={medOpen}>
							<Popover.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										id="medication-picker"
										variant="outline"
										class="w-full justify-between font-normal"
										role="combobox"
										aria-expanded={medOpen}
										aria-invalid={Boolean(addError)}
									>
										{selectedMed
											? selectedMed.name
											: availableMedications.length > 0
												? 'Выберите препарат'
												: 'Все препараты добавлены'}
										<ChevronDownIcon />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-[24rem] p-0">
								<Command.Root disableInitialScroll>
									<Command.Input placeholder="Поиск препаратов..." />
									<Command.List>
										<Command.Empty>Доступные препараты не найдены.</Command.Empty>
										<Command.Group>
											{#each availableMedications as medication (medication.id)}
												<Command.Item
													value={`${medication.name} ${medication.id}`}
													onSelect={() => {
														selectedMedId = medication.id;
														medOpen = false;
													}}
												>
													<span class="font-medium">{medication.name}</span>
													<span class="text-muted-foreground">{medication.method}</span>
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
						<input type="hidden" name="med_id" value={selectedMedId} />
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="new-dosage">Дозировка</Field.FieldLabel>
						<Input
							id="new-dosage"
							name="dosage"
							type="number"
							min="0"
							step="any"
							bind:value={selectedDosage}
							placeholder="например, 0.5"
						/>
					</Field.Field>
					<Button type="submit" disabled={!selectedMed}>
						<PlusIcon data-icon="inline-start" />
						Добавить препарат
					</Button>
				</Field.FieldGroup>
				{#if addError}
					<Field.Field data-invalid>
						<Field.FieldDescription>{addError}</Field.FieldDescription>
					</Field.Field>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Применённые препараты</Card.Title>
			<Card.Description>Дозировку можно изменить прямо в таблице.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">Всего: {applications.length}</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if applications.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><PillIcon /></Empty.Media>
						<Empty.Title>Препараты не применены</Empty.Title>
						<Empty.Description>Добавьте препарат выше, чтобы привязать его к процедуре.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Препарат</Table.Head>
							<Table.Head>Способ применения</Table.Head>
							<Table.Head class="w-48">Дозировка</Table.Head>
							<Table.Head>Идентификатор знака</Table.Head>
							<Table.Head class="text-right">Убрать</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each applications as application (application.med_id)}
							<Table.Row>
								<Table.Cell class="font-medium">{application.med_name}</Table.Cell>
								<Table.Cell>{application.med_method}</Table.Cell>
								<Table.Cell>
									<InlineEdit
										label="Дозировка"
										name="dosage"
										inputName="dosage"
										type="number"
										value={application.dosage}
										action="?/updateApplication"
										hidden={{ med_id: application.med_id }}
										min="0"
										step="any"
										required
									/>
								</Table.Cell>
								<Table.Cell class="max-w-64 truncate font-mono text-xs">
									{application.med_id}
								</Table.Cell>
								<Table.Cell class="text-right">
									<ConfirmDelete
										action="?/deleteApplication"
										hidden={{ med_id: application.med_id }}
										label="Убрать"
										title="Убрать этот препарат?"
										description="Назначение будет отвязано от этой процедуры."
									/>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
