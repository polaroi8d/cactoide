<script lang="ts">
	import { t } from '$lib/i18n/i18n.js';

	interface Props {
		emoji: string;
		titleKey: string;
		descriptionKey: string;
	}

	let { emoji, titleKey, descriptionKey }: Props = $props();
</script>

<div class="rounded-sm border p-4 text-center">
	<div class="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full">
		<span class="text-4xl">{emoji}</span>
	</div>
	<h3 class="mb-4 text-xl font-bold text-white">{t(titleKey)}</h3>
	<p class="">{t(descriptionKey)}</p>
</div>
