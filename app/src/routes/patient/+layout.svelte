<script>
	import * as Avatar from '#lib/components/ui/avatar';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
	import HouseIcon from '@lucide/svelte/icons/house';

	let { data, children } = $props();

	let patientName = $derived(data.patient?.fullname ?? 'Patient');
	let initials = $derived(
		patientName
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('') || 'P'
	);
</script>

{#if data.showHeader}
	<div class="flex min-h-screen flex-col">
		<header class="border-b bg-card text-card-foreground">
			<div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div class="flex items-center gap-3">
					<HeartPulseIcon class="size-5 text-primary" />
					<Button href="/patient" variant="ghost" size="sm">
						<HouseIcon data-icon="inline-start" />
						Home
					</Button>
					<span class="text-muted-foreground">/</span>
					<span class="text-sm font-medium">{patientName}</span>
				</div>

				<Button href="/patient/profile" variant="outline" size="sm" class="gap-2">
					<Avatar.Root class="size-7">
						<Avatar.Fallback>{initials}</Avatar.Fallback>
					</Avatar.Root>
					<Badge variant="secondary">Profile</Badge>
				</Button>
			</div>
		</header>

		<main class="mx-auto w-full max-w-6xl flex-1 p-4">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
