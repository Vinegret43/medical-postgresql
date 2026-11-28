<script>
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import { buttonVariants } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	} = $props();
</script>

<PaginationPrimitive.PrevButton
	bind:ref
	aria-label="Перейти на предыдущую страницу"
	class={cn(
		buttonVariants({ variant: "ghost", size: "default" }),
		"pl-2!",
		className
	)}
	{...restProps}
>
	<ChevronLeftIcon data-icon="inline-start" class="cn-rtl-flip" />
	<span class="hidden sm:block">Назад</span>
</PaginationPrimitive.PrevButton>