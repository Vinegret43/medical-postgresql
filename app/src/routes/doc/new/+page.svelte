<script>
	import { enhance } from '$app/forms';
	import { tick, untrack } from 'svelte';
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import * as Command from '#lib/components/ui/command';
	import * as Field from '#lib/components/ui/field';
	import * as Popover from '#lib/components/ui/popover';
	import * as Table from '#lib/components/ui/table';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Textarea } from '#lib/components/ui/textarea';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UserRoundCheckIcon from '@lucide/svelte/icons/user-round-check';

	let { data, form } = $props();

	let oms = $state(untrack(() => form?.values?.oms ?? data.initialOms ?? ''));
	let patientPreview = $state(untrack(() => form?.patient ?? data.patient ?? null));
	let omsError = $state(untrack(() => data.omsError ?? null));
	let procName = $state(untrack(() => form?.values?.proc_name ?? ''));
	let procTime = $state(untrack(() => form?.values?.proc_time || data.openedAtLocal));
	let remarks = $state(untrack(() => form?.values?.remarks ?? ''));
	let recommendations = $state(untrack(() => form?.values?.recommendations ?? ''));

	let added = $state(untrack(() => form?.values?.medications ?? []));
	let medOpen = $state(false);
	let selectedMedId = $state('');
	let selectedDosage = $state('');
	let medError = $state('');
	let lookupTimer;

	let selectedMed = $derived(
		data.medications.find((medication) => medication.id === selectedMedId) ?? null
	);

	function scheduleLookup() {
		clearTimeout(lookupTimer);
		lookupTimer = setTimeout(async () => {
			if (!/^\d{1,19}$/.test(oms)) {
				patientPreview = null;
				omsError = oms ? 'OMS must contain only digits.' : null;
				return;
			}

			const response = await fetch(`/doc/patients/lookup?oms=${encodeURIComponent(oms)}`);
			const result = await response.json();

			if (result.found) {
				patientPreview = { oms: result.oms, fullname: result.fullname };
				omsError = null;
			} else {
				patientPreview = null;
				omsError = 'No patient exists with that OMS policy number.';
			}
		}, 250);
	}

	function closeAndFocusTrigger() {
		medOpen = false;
		tick().then(() => document.getElementById('medication-picker')?.focus());
	}

	function selectMedication(medication) {
		selectedMedId = medication.id;
		medError = '';
		closeAndFocusTrigger();
	}

	function addMedication() {
		const dosage = Number(selectedDosage);

		if (!selectedMed) {
			medError = 'Choose a medication from the list.';
			return;
		}
		if (!Number.isFinite(dosage) || dosage <= 0) {
			medError = 'Dosage must be greater than zero.';
			return;
		}

		const existing = added.find((medication) => medication.id === selectedMed.id);
		if (existing) {
			added = added.map((medication) =>
				medication.id === selectedMed.id
					? { ...medication, dosage: medication.dosage + dosage }
					: medication
			);
		} else {
			added = [
				...added,
				{
					id: selectedMed.id,
					name: selectedMed.name,
					method: selectedMed.method,
					dosage
				}
			];
		}

		selectedMedId = '';
		selectedDosage = '';
		medError = '';
	}

	function removeMedication(id) {
		added = added.filter((medication) => medication.id !== id);
	}
</script>

<svelte:head>
	<title>New procedure</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Button href="/doc" variant="ghost" size="sm" class="self-start">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to my procedures
	</Button>

	{#if form?.message}
		<Alert.Root variant="destructive">
			<ShieldAlertIcon />
			<Alert.Title>Could not create procedure</Alert.Title>
			<Alert.Description>{form.message}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Patient</Card.Title>
			<Card.Description>
				Enter the OMS policy number. The patient name is checked against the database.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="GET" action="/doc/new">
				<Field.FieldGroup class="gap-3 sm:flex-row sm:items-end">
					<Field.Field class="flex-1" data-invalid={Boolean(omsError)}>
						<Field.FieldLabel for="oms-check">OMS policy number</Field.FieldLabel>
						<Input
							id="oms-check"
							name="oms"
							bind:value={oms}
							oninput={scheduleLookup}
							inputmode="numeric"
							aria-invalid={Boolean(omsError)}
							placeholder="e.g. 2000000001"
						/>
						{#if omsError}
							<Field.FieldDescription>{omsError}</Field.FieldDescription>
						{:else if patientPreview}
							<Field.FieldDescription>
								<UserRoundCheckIcon class="inline size-4" />
								{patientPreview.fullname}
							</Field.FieldDescription>
						{/if}
					</Field.Field>
					<Button type="submit" variant="outline">
						Check patient
					</Button>
				</Field.FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>

	<form method="POST" use:enhance class="flex flex-col gap-4">
		<input type="hidden" name="oms" value={oms} />

		<Card.Root>
			<Card.Header>
				<Card.Title>Procedure details</Card.Title>
				<Card.Description>
					The form was opened at {data.openedAtLocal} UTC. You can change the time below.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Field.FieldGroup class="gap-4">
					<Field.Field>
						<Field.FieldLabel for="proc_name">Procedure name</Field.FieldLabel>
						<Input
							id="proc_name"
							name="proc_name"
							bind:value={procName}
							maxlength="200"
							required
							placeholder="e.g. Consultation"
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="proc_time">Procedure time (UTC)</Field.FieldLabel>
						<Input id="proc_time" name="proc_time" type="datetime-local" bind:value={procTime} />
						<Field.FieldDescription>
							Leave as-is to keep the time when this form was opened.
						</Field.FieldDescription>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="remarks">Remarks</Field.FieldLabel>
						<Textarea
							id="remarks"
							name="remarks"
							bind:value={remarks}
							placeholder="Personal notes about the procedure"
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="recommendations">Recommendations</Field.FieldLabel>
						<Textarea
							id="recommendations"
							name="recommendations"
							bind:value={recommendations}
							placeholder="Recommendations for the patient"
						/>
					</Field.Field>
				</Field.FieldGroup>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Medications</Card.Title>
				<Card.Description>
					Choose a medication and dosage. Adding the same medication again adds to its dosage.
				</Card.Description>
				<Card.Action>
					<Badge variant="secondary">{added.length} added</Badge>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<Field.FieldGroup class="gap-3 sm:flex-row sm:items-end">
						<Field.Field class="flex-1" data-invalid={Boolean(medError)}>
							<Field.FieldLabel for="medication-picker">Medication</Field.FieldLabel>
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
											aria-invalid={Boolean(medError)}
										>
											{selectedMed ? selectedMed.name : 'Select a medication'}
											<ChevronDownIcon />
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-[24rem] p-0">
									<Command.Root>
										<Command.Input placeholder="Search medications..." />
										<Command.List>
											<Command.Empty>No medications found.</Command.Empty>
											<Command.Group>
												{#each data.medications as medication (medication.id)}
													<Command.Item
														value={`${medication.name} ${medication.id}`}
														onSelect={() => selectMedication(medication)}
													>
														<span class="font-medium">{medication.name}</span>
														<span class="text-muted-foreground">{medication.method}</span>
														<span class="ml-auto font-mono text-xs">{medication.id}</span>
													</Command.Item>
												{/each}
											</Command.Group>
										</Command.List>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
						</Field.Field>
						<Field.Field>
							<Field.FieldLabel for="dosage">Dosage</Field.FieldLabel>
							<Input
								id="dosage"
								type="number"
								min="0"
								step="any"
								bind:value={selectedDosage}
								placeholder="e.g. 0.5"
							/>
						</Field.Field>
						<Button type="button" variant="outline" onclick={addMedication}>
							<PlusIcon data-icon="inline-start" />
							Add
						</Button>
					</Field.FieldGroup>
					{#if medError}
						<Field.FieldDescription>{medError}</Field.FieldDescription>
					{/if}

					{#each added as medication (medication.id)}
						<input type="hidden" name="med_id" value={medication.id} />
						<input type="hidden" name="dosage" value={medication.dosage} />
					{/each}

					{#if added.length === 0}
						<p class="text-sm text-muted-foreground">
							No medications added. The procedure can still be saved without applications.
						</p>
					{:else}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Medicine</Table.Head>
									<Table.Head>Method</Table.Head>
									<Table.Head class="text-right">Dosage</Table.Head>
									<Table.Head class="text-right">Remove</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each added as medication (medication.id)}
									<Table.Row>
										<Table.Cell class="font-medium">{medication.name}</Table.Cell>
										<Table.Cell>{medication.method}</Table.Cell>
										<Table.Cell class="text-right">{medication.dosage}</Table.Cell>
										<Table.Cell class="text-right">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												aria-label={`Remove ${medication.name}`}
												onclick={() => removeMedication(medication.id)}
											>
												<Trash2Icon />
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{/if}
				</div>
			</Card.Content>
			<Card.Footer class="justify-between">
				<Button href="/doc" variant="ghost" type="button">Cancel</Button>
				<Button type="submit">Create procedure</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
