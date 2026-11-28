<script>
	import { enhance } from '$app/forms';
	import * as AlertDialog from '#lib/components/ui/alert-dialog';
	import { Button } from '#lib/components/ui/button';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let {
		action = '?/delete',
		hidden = {},
		label = 'Удалить',
		confirmLabel = 'Удалить',
		title = 'Удалить эту запись?',
		description = 'Это действие нельзя отменить.'
	} = $props();

	let open = $state(false);
	let busy = $state(false);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="destructive" size="sm">
				<Trash2Icon data-icon="inline-start" />
				{label}
			</Button>
		{/snippet}
	</AlertDialog.Trigger>
	<AlertDialog.Portal>
		<AlertDialog.Overlay />
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{title}</AlertDialog.Title>
				<AlertDialog.Description>{description}</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Отмена</AlertDialog.Cancel>
				<form
					method="POST"
					{action}
					use:enhance={() => {
						busy = true;
						return async ({ result, update }) => {
							busy = false;
							open = false;
							await update({ reset: false });
						};
					}}
				>
					{#each Object.entries(hidden) as [key, hiddenValue]}
						<input type="hidden" name={key} value={hiddenValue} />
					{/each}
					<Button type="submit" variant="destructive" disabled={busy}>{confirmLabel}</Button>
				</form>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
