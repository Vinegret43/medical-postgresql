<script>
	import { page } from '$app/state';
	import * as Avatar from '#lib/components/ui/avatar';
	import { Badge } from '#lib/components/ui/badge';
	import { Button } from '#lib/components/ui/button';
	import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
	import HouseIcon from '@lucide/svelte/icons/house';

	let { data, children } = $props();

	const links = [
		{ href: '/doc', label: 'Мои процедуры' },
		{ href: '/doc/all', label: 'Все процедуры' },
		{ href: '/doc/patients', label: 'Пациенты' },
		{ href: '/doc/new', label: 'Новая процедура' },
		{ href: '/doc/meds', label: 'Лекарства' }
	];

	let doctorName = $derived(data.doctor?.fullname ?? 'Врач');
	let initials = $derived(
		doctorName
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('') || 'D'
	);
	let pathname = $derived(page.url.pathname);

	function isActive(href) {
		return href === '/doc' ? pathname === '/doc' : pathname.startsWith(href);
	}
</script>

{#if data.showHeader}
	<div class="flex min-h-screen flex-col">
		<header class="border-b bg-card text-card-foreground">
			<div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div class="flex flex-wrap items-center gap-2">
					<HeartPulseIcon class="size-5 text-primary" />
					<Button href="/doc" variant="ghost" size="sm">
						<HouseIcon data-icon="inline-start" />
						Главная
					</Button>
					<span class="text-muted-foreground">/</span>
					<span class="text-sm font-medium">{doctorName}</span>
				</div>

				<nav class="flex flex-wrap items-center gap-1">
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

				<Button href="/doc/profile" variant="outline" size="sm" class="gap-2 pt-4 pb-4">
					<Avatar.Root class="size-6">
						<Avatar.Fallback>{initials}</Avatar.Fallback>
					</Avatar.Root>
					Профиль
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
