<script>
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { t } from '$lib/i18n/i18n.js';

	let { children } = $props();
</script>

<svelte:head>
	<title>{t('layout.defaultTitle')}</title>
	<meta name="description" content={t('layout.defaultDescription')} />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<div class="min-h-screen font-mono text-white">
	<div class="relative">
		<!-- Navbar -->
		<Navbar />

		<!-- Main content -->
		<main class="relative z-10">
			{@render children?.()}
		</main>

		<!-- Footer -->
		<footer class="py-12">
			<div class="container mx-auto px-4 text-center">
				<div class="text-sm">
					<p>{t('layout.copyright')}</p>
				</div>
			</div>
		</footer>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: linear-gradient(
			135deg,
			#080818 0%,
			#0f0f1f 25%,
			#0a0a1a 50%,
			#0a1428 75%,
			#020614 100%
		);
		background-attachment: fixed;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
