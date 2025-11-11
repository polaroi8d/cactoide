<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/i18n.js';
	import FeatureCard from '$lib/components/FeatureCard.svelte';
</script>

<svelte:head>
	<title>{t('home.title')}</title>
	<meta name="description" content={t('home.description')} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<section class="mx-auto w-full pt-20 pb-20 md:w-3/4">
		<div class="container mx-auto px-4 text-center">
			<h1 class="text-5xl font-bold md:text-7xl lg:text-8xl">
				{t('home.mainTitle')}<span class="text-violet-400"
					><a href="https://en.wikipedia.org/wiki/Cactoideae" target="_blank">*</a></span
				> 🌵
			</h1>

			<h2 class="mt-6 text-xl md:text-2xl">{t('home.subtitle')}</h2>
			<p class="mt-4 text-lg italic md:text-xl">
				{t('home.tagline')}
			</p>

			<!-- Open Source Section -->
			<div class="mt-8 flex items-center justify-center gap-3">
				<a
					href="https://github.com/polaroi8d/cactoide"
					target="_blank"
					rel="noopener noreferrer"
					class="group flex items-center gap-2 rounded-sm border-2 border-violet-500/50 px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 hover:border-violet-500 hover:bg-violet-500/10 md:text-base"
					aria-label={t('home.viewOnGitHub')}
				>
					<svg
						class="h-5 w-5 transition-transform group-hover:scale-110"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>{t('home.viewOnGitHub')}</span>
				</a>
			</div>
			<p class="mt-4 text-sm text-slate-400 md:text-base">
				{t('home.openSourceDescription')}
			</p>

			<h2 class="mt-6 pt-8 text-xl md:text-2xl">
				{t('home.whyCactoideTitle')}<span class="text-violet-400"
					><a href="https://en.wikipedia.org/wiki/Cactoideae" target="_blank">*</a></span
				>
			</h2>
			<p class="mt-4 text-lg md:text-xl">
				{t('home.whyCactoideDescription')}
			</p>

			<button
				on:click={() => goto('/create')}
				class="mt-8 rounded-sm border-2 border-violet-500 px-8 py-4 font-bold duration-400 hover:scale-110 hover:bg-violet-500/10"
			>
				{t('home.createEventNow')}
			</button>
		</div>
	</section>

	<!-- Public Events Section -->
	<section class="py-8">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<h2 class="text-4xl font-bold text-white">{t('home.discoverPublicEventsTitle')}</h2>
				<p class="mt-4 text-xl text-slate-300">{t('home.discoverPublicEventsDescription')}</p>
			</div>

			<div class="text-center">
				<button
					on:click={() => goto('/discover')}
					class="rounded-sm border-2 border-violet-500 px-8 py-4 font-bold duration-400 hover:scale-110 hover:bg-violet-500/10"
				>
					{t('home.browseAllPublicEvents')}
				</button>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-20">
		<div class="container mx-auto px-4">
			<h2 class=" mb-16 text-center text-4xl font-bold">
				{t('home.whyCactoideFeatureTitle')}
			</h2>
			<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
				<FeatureCard
					emoji="🎯"
					titleKey="home.instantEventCreationTitle"
					descriptionKey="home.instantEventCreationDescription"
				/>

				<FeatureCard
					emoji="🔗"
					titleKey="home.oneClickSharingTitle"
					descriptionKey="home.oneClickSharingDescription"
				/>

				<FeatureCard
					emoji="🔍"
					titleKey="home.allInOneClarityTitle"
					descriptionKey="home.allInOneClarityDescription"
				/>

				<FeatureCard
					emoji="👤"
					titleKey="home.noHassleNoSignUpsTitle"
					descriptionKey="home.noHassleNoSignUpsDescription"
				/>

				<FeatureCard
					emoji="🛡️"
					titleKey="home.smartLimitsTitle"
					descriptionKey="home.smartLimitsDescription"
				/>

				<FeatureCard
					emoji="✨"
					titleKey="home.effortlessSimplicityTitle"
					descriptionKey="home.effortlessSimplicityDescription"
				/>

				<FeatureCard
					emoji="🎫"
					titleKey="home.inviteLinksTitle"
					descriptionKey="home.inviteLinksDescription"
				/>

				<FeatureCard
					emoji="🌐"
					titleKey="home.federationTitle"
					descriptionKey="home.federationDescription"
				/>
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section class="py-20">
		<div class="container mx-auto px-4">
			<h2 class=" mb-16 text-center text-4xl font-bold">{t('home.howItWorksTitle')}</h2>

			<div class="grid gap-8 md:grid-cols-3">
				<!-- Step 1 -->
				<div class="text-center">
					<h3 class="mb-4 text-xl font-bold text-white">
						<span class="text-violet-400">1.</span>
						{t('home.step1Title')}
					</h3>
					<p class="">
						{t('home.step1Description')}
					</p>
				</div>

				<!-- Step 2 -->
				<div class="text-center">
					<h3 class="mb-4 text-xl font-bold text-white">
						<span class="text-violet-400">2.</span>
						{t('home.step2Title')}
					</h3>
					<p class="">
						{t('home.step2Description')}
					</p>
				</div>

				<!-- Step 3 -->
				<div class="text-center">
					<h3 class="mb-4 text-xl font-bold text-white">
						<span class="text-violet-400">3.</span>
						{t('home.step3Title')}
					</h3>
					<p class="">{t('home.step3Description')}</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-20">
		<div class="container mx-auto px-4 text-center">
			<h2 class="mb-6 text-4xl font-bold text-white">
				{t('home.ctaTitle')}
			</h2>
			<p class="mb-10 text-xl">{t('home.ctaDescription')}</p>
			<button
				on:click={() => goto('/create')}
				class="rounded-sm border-2 border-violet-500 px-8 py-4 font-bold duration-400 hover:scale-110 hover:bg-violet-500/10"
			>
				{t('home.ctaButton')}
			</button>
		</div>
	</section>
</div>
