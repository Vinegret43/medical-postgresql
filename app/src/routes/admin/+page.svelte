<script>
	import * as Card from '#lib/components/ui/card';
	import { Button } from '#lib/components/ui/button';
	import { Badge } from '#lib/components/ui/badge';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import PillIcon from '@lucide/svelte/icons/pill';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';

	const sections = [
		{
			href: '/admin/patients',
			title: 'Patients',
			description: 'Add, edit, and remove patient records and their sign-in codes.',
			icon: UserRoundIcon
		},
		{
			href: '/admin/doctors',
			title: 'Doctors',
			description: 'Add, edit, and remove doctor records and their sign-in codes.',
			icon: StethoscopeIcon
		},
		{
			href: '/admin/meds',
			title: 'Medications',
			description: 'Maintain the medication catalog and its manual mark IDs.',
			icon: PillIcon
		},
		{
			href: '/admin/procedures',
			title: 'Procedures',
			description: 'Edit procedure notes and manage the medications applied to them.',
			icon: ActivityIcon
		}
	];
</script>

<svelte:head>
	<title>Administration</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Administration</Card.Title>
			<Card.Description>Choose a section to manage.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">Admin</Badge>
			</Card.Action>
		</Card.Header>
	</Card.Root>

	<div class="grid gap-4 sm:grid-cols-2">
		{#each sections as section (section.href)}
			<Card.Root>
				<Card.Header>
					<section.icon class="size-5 text-primary" />
					<Card.Title>{section.title}</Card.Title>
					<Card.Description>{section.description}</Card.Description>
				</Card.Header>
				<Card.Footer>
					<Button href={section.href} variant="outline">Open {section.title.toLowerCase()}</Button>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>
