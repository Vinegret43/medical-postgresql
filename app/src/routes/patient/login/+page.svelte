<script>
	import { enhance } from '$app/forms';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import * as Alert from '#lib/components/ui/alert';
	import * as Card from '#lib/components/ui/card';
	import * as Field from '#lib/components/ui/field';
	import * as InputOTP from '#lib/components/ui/input-otp';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	let { form } = $props();
</script>

<svelte:head><title>Вход для пациента</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
	<form method="POST" use:enhance class="w-full max-w-md">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title>Вход для пациента</Card.Title>
				<Card.Description>Войдите, используя номер полиса ОМС и одноразовый код.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Field.FieldGroup class="gap-4">
					<Field.Field>
						<Field.FieldLabel for="identifier">Номер полиса ОМС</Field.FieldLabel>
						<Input
							id="identifier"
							name="identifier"
							inputmode="numeric"
							autocomplete="username"
							required
						/>
					</Field.Field>
					<Field.Field class="w-fit">
						<Field.FieldLabel for="secret">Код TOTP</Field.FieldLabel>
						<InputOTP.Root
							inputId="secret"
							name="secret"
							maxlength={6}
							pattern={REGEXP_ONLY_DIGITS}
							required
						>
							{#snippet children({ cells })}
								<InputOTP.Group
									class="*:data-[slot=input-otp-slot]:size-10 *:data-[slot=input-otp-slot]:text-lg"
								>
									{#each cells.slice(0, 3) as cell (cell)}
										<InputOTP.Slot {cell} />
									{/each}
								</InputOTP.Group>
								<InputOTP.Separator class="mx-2" />
								<InputOTP.Group
									class="*:data-[slot=input-otp-slot]:size-10 *:data-[slot=input-otp-slot]:text-lg"
								>
									{#each cells.slice(3, 6) as cell (cell)}
										<InputOTP.Slot {cell} />
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
						<Field.FieldDescription>
							Введите 6-значный код из приложения-аутентификатора.
						</Field.FieldDescription>
					</Field.Field>
				</Field.FieldGroup>

				{#if form?.message}
					<Alert.Root variant="destructive" class="mt-4">
						<ShieldAlertIcon />
						<Alert.Title>Ошибка входа</Alert.Title>
						<Alert.Description>{form.message}</Alert.Description>
					</Alert.Root>
				{/if}
			</Card.Content>
			<Card.Footer class="flex-col gap-3">
				<Button type="submit" class="w-full">Войти</Button>
				<Button href="/" variant="ghost" size="sm">К выбору роли</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</main>
