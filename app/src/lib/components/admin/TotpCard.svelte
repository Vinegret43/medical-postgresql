<script>
	import { enhance } from '$app/forms';
	import * as AlertDialog from '#lib/components/ui/alert-dialog';
	import * as Card from '#lib/components/ui/card';
	import { Button } from '#lib/components/ui/button';
	import { Badge } from '#lib/components/ui/badge';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

	let { handoff, subjectType = 'account' } = $props();

	let revealed = $state(false);
	let busy = $state(false);
	let open = $state(false);

	let masked = $derived('•'.repeat(Math.min(handoff?.secret?.length ?? 24, 32)));
</script>

{#if handoff}
	<Card.Root>
		<Card.Header>
			<Card.Title>Sign-in code</Card.Title>
			<Card.Description>
				Give this secret or QR code to the {subjectType}. Codes change every 30 seconds.
			</Card.Description>
			<Card.Action>
				<Badge variant="secondary">TOTP</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-[1fr_auto]">
				<div class="flex flex-col gap-3">
					<div class="flex flex-col gap-1">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Base32 secret</span>
						<code class="break-all font-mono text-sm select-all">
							{revealed ? handoff.secret : masked}
						</code>
					</div>

					<div class="flex flex-wrap gap-2">
						<Button type="button" size="sm" variant="outline" onclick={() => (revealed = !revealed)}>
							<KeyRoundIcon data-icon="inline-start" />
							{revealed ? 'Hide' : 'Reveal'}
						</Button>

						<AlertDialog.Root bind:open>
							<AlertDialog.Trigger>
								{#snippet child({ props })}
									<Button {...props} size="sm" variant="destructive">
										<RefreshCwIcon data-icon="inline-start" />
										Regenerate
									</Button>
								{/snippet}
							</AlertDialog.Trigger>
							<AlertDialog.Portal>
								<AlertDialog.Overlay />
								<AlertDialog.Content>
									<AlertDialog.Header>
										<AlertDialog.Title>Regenerate this secret?</AlertDialog.Title>
										<AlertDialog.Description>
											The old secret stops working immediately and all active sessions for this
											{subjectType} are revoked.
										</AlertDialog.Description>
									</AlertDialog.Header>
									<AlertDialog.Footer>
										<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
										<form
											method="POST"
											action="?/regenerateTotp"
											use:enhance={() => {
												busy = true;
												return async ({ result, update }) => {
													busy = false;
													if (result.type === 'success') revealed = true;
													open=false;
													await update({ reset: false });
												};
											}}
										>
											<Button type="submit" variant="destructive" disabled={busy}>
												Regenerate secret
											</Button>
										</form>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Portal>
						</AlertDialog.Root>
					</div>
				</div>

				<div class="flex flex-col items-center gap-2">
					<img
						src={handoff.qrDataUrl}
						alt="TOTP enrollment QR code"
						class="size-40 rounded-md border bg-background p-2 transition"
						class:blur-lg={!revealed}
						class:select-none={!revealed}
						class:pointer-events-none={!revealed}
						aria-hidden={!revealed}
					/>
					<span class="text-xs text-muted-foreground">
						{revealed ? 'Scan with an authenticator app' : 'Reveal to scan'}
					</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
