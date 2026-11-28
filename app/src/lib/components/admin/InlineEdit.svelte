<script>
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import * as Field from '#lib/components/ui/field';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Textarea } from '#lib/components/ui/textarea';
	import { formatDate, formatDateTime } from '#lib/format.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		label,
		name,
		value,
		inputName = 'value',
		type = 'text',
		action = '?/updateField',
		hidden = {},
		required = false,
		nullable = false,
		maxlength,
		min,
		step,
		rows = 3,
		error = null
	} = $props();

	let editing = $state(false);
	let busy = $state(false);
	let localError = $state(null);
	let draft = $state(untrack(() => toInputValue(value, type)));
	let formElement = $state(null);

	function toInputValue(raw, inputType) {
		if (raw === null || raw === undefined) return '';
		if (inputType !== 'datetime-local') return String(raw);

		const date = raw instanceof Date ? raw : new Date(raw);
		if (Number.isNaN(date.getTime())) return String(raw);
		const pad = (part) => String(part).padStart(2, '0');
		return (
			`${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
			`T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
		);
	}

	$effect(() => {
		if (!editing) draft = toInputValue(value, type);
	});

	let display = $derived.by(() => {
		if (value === null || value === undefined || String(value) === '') return '—';
		if (type === 'date') return formatDate(value);
		if (type === 'datetime-local') return formatDateTime(value);
		return String(value);
	});

	let shownError = $derived(localError ?? error ?? null);

	function cancel() {
		draft = toInputValue(value, type);
		localError = null;
		editing = false;
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			cancel();
			return;
		}

		const submitShortcut =
			type === 'textarea' ? event.ctrlKey || event.metaKey : !event.shiftKey;
		if (event.key === 'Enter' && submitShortcut) {
			event.preventDefault();
			formElement?.requestSubmit();
		}
	}
</script>

<div class="flex flex-col gap-1">
	<span class="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>

	{#if editing}
		<form
			bind:this={formElement}
			method="POST"
			action={action}
			class="flex flex-col gap-2"
			use:enhance={() => {
				busy = true;
				return async ({ result, update }) => {
					busy = false;
					if (result.type === 'success') {
						localError = null;
						editing = false;
					} else if (result.type === 'failure') {
						localError = String(result.data?.message ?? 'Could not save the change.');
					}
					await update({ reset: result.type === 'success' });
				};
			}}
		>
			<input type="hidden" name="field" value={name} />
			{#each Object.entries(hidden) as [key, hiddenValue]}
				<input type="hidden" name={key} value={hiddenValue} />
			{/each}

			<Field.Field data-invalid={Boolean(shownError)}>
				<Field.FieldLabel for={`edit-${name}`} class="sr-only">{label}</Field.FieldLabel>
				{#if type === 'textarea'}
					<Textarea
						id={`edit-${name}`}
						name={inputName}
						bind:value={draft}
						{rows}
						{maxlength}
						required={required && !nullable}
						aria-invalid={Boolean(shownError)}
						onkeydown={handleKeydown}
					/>
				{:else}
					<Input
						id={`edit-${name}`}
						name={inputName}
						type={type === 'number' ? 'number' : type}
						bind:value={draft}
						{maxlength}
						{min}
						{step}
						required={required && !nullable}
						aria-invalid={Boolean(shownError)}
						onkeydown={handleKeydown}
					/>
				{/if}
				{#if shownError}
					<Field.FieldDescription>{shownError}</Field.FieldDescription>
				{/if}
			</Field.Field>

			<div class="flex flex-wrap gap-2">
				<Button type="submit" size="sm" disabled={busy}>Save</Button>
				<Button type="button" size="sm" variant="ghost" onclick={cancel} disabled={busy}>
					<XIcon data-icon="inline-start" />
					Cancel
				</Button>
			</div>
		</form>
	{:else}
		<div class="flex min-w-0 items-start justify-between gap-2">
			<span
				class="min-w-0 whitespace-pre-wrap wrap-break-word font-medium"
				class:text-muted-foreground={display === '—'}>{display}</span
			>
			<Button
				type="button"
				size="icon-sm"
				variant="ghost"
				aria-label={`Edit ${label}`}
				onclick={() => {
					localError = null;
					editing = true;
				}}
			>
				<PencilIcon />
			</Button>
		</div>
		{#if shownError}
			<Field.Field data-invalid>
				<Field.FieldDescription>{shownError}</Field.FieldDescription>
			</Field.Field>
		{/if}
	{/if}
</div>
