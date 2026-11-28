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
			title: 'Пациенты',
			description: 'Добавление, изменение и удаление данных пациентов и их кодов для входа.',
			icon: UserRoundIcon
		},
		{
			href: '/admin/doctors',
			title: 'Врачи',
			description: 'Добавление, изменение и удаление данных врачей и их кодов для входа.',
			icon: StethoscopeIcon
		},
		{
			href: '/admin/meds',
			title: 'Лекарства',
			description: 'Ведение каталога лекарств и идентификаторов «честного знака».',
			icon: PillIcon
		},
		{
			href: '/admin/procedures',
			title: 'Процедуры',
			description: 'Изменение замечаний к процедурам и назначенных препаратов.',
			icon: ActivityIcon
		}
	];
</script>

<svelte:head>
	<title>Администрирование</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Администрирование</Card.Title>
			<Card.Description>Выберите раздел для управления.</Card.Description>
			<Card.Action>
				<Badge variant="secondary">Администратор</Badge>
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
					<Button href={section.href} variant="outline">Открыть раздел</Button>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>
