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
	<title>Процедуры</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if form?.message}
		<Alert.Root variant={form?.success ? 'default' : 'destructive'}>
			{#if form?.success}
				<CircleCheckIcon />
			{:else}
				<ShieldAlertIcon />
			{/if}
			<Alert.Title>{form.success ? 'Готово' : 'Не удалось удалить процедуру'}</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Процедуры</Card.Title>
			<Card.Description>
				Изменение замечаний и назначений процедуры. Пациент и врач не меняются.
			</Card.Description>
			<Card.Action>
				<Badge variant="secondary">Всего: {procedures.length}</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if procedures.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><ActivityIcon /></Empty.Media>
						<Empty.Title>Процедур пока нет</Empty.Title>
						<Empty.Description>Процедуры создают врачи.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Дата</Table.Head>
							<Table.Head>Пациент</Table.Head>
							<Table.Head>Врач</Table.Head>
							<Table.Head>Процедура</Table.Head>
							<Table.Head>Последнее изменение</Table.Head>
							<Table.Head class="text-right">Действия</Table.Head>
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
											Управлять
										</Button>
										<ConfirmDelete
											action="?/delete"
											hidden={{ proc_id: procedure.proc_id }}
											label="Удалить"
											title="Удалить эту процедуру?"
											description="Назначения препаратов также будут удалены."
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
