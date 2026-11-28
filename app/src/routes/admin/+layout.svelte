<script>
	import { page } from '$app/state';
	import * as Avatar from '#lib/components/ui/avatar';
	import { Button } from '#lib/components/ui/button';
	import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
	import HouseIcon from '@lucide/svelte/icons/house';

	let { data, children } = $props();

	const links = [
		{ href: '/admin/patients', label: 'Patients' },
		{ href: '/admin/doctors', label: 'Doctors' },
		{ href: '/admin/meds', label: 'Medications' },
		{ href: '/admin/procedures', label: 'Procedures' },
	];

	let adminName = $derived(data.admin?.fullname ?? 'Admin');
	let initials = $derived(
		adminName
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('') || 'D'
	);
	let pathname = $derived(page.url.pathname);

	function isActive(href) {
		return pathname === href || pathname.startsWith(`${href}/`);
	}
</script>

{#if data.showHeader}
	<div class="flex min-h-screen flex-col">
		<header class="border-b bg-card text-card-foreground">
			<div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div class="flex flex-wrap items-center gap-2">
					<HeartPulseIcon class="size-5 text-primary" />
					<Button href="/admin" variant="ghost" size="sm">
						<HouseIcon data-icon="inline-start" />
						Home
					</Button>
					<span class="text-muted-foreground">/</span>
					<span class="text-sm font-medium">Administration</span>
				</div>

				<nav class="flex flex-wrap items-center gap-1">
					<Button href="/admin" variant={pathname === '/admin' ? 'secondary' : 'ghost'} size="sm">
						Dashboard
					</Button>
					{#each links as link (link.href)}
						<Button
							href={link.href}
							variant={isActive(link.href) ? 'secondary' : 'ghost'}
							size="sm"
						>
							{link.label}
						</Button>
					{/each}
				</nav>

				<Button
					href="/admin/profile"
					variant="outline"
					size="sm"
					class="gap-2 pt-4 pb-4"
				>
					<Avatar.Root class="size-6">
						<Avatar.Fallback>{initials}</Avatar.Fallback>
					</Avatar.Root>
					Profile
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
