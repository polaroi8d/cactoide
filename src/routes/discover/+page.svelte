<script lang="ts">
	import type { Event, EventType } from '$lib/types';
	import { goto } from '$app/navigation';
	import { formatTime, formatDate, isEventInTimeRange } from '$lib/dateHelpers';
	import { t } from '$lib/i18n/i18n.js';
	import Fuse from 'fuse.js';

	type DiscoverPageData = {
		events: Event[];
	};

	let publicEvents: Event[] = [];
	let error = '';
	let searchQuery = '';
	let selectedEventType: EventType | 'all' = 'all';
	let selectedTimeFilter: 'any' | 'next-week' | 'next-month' = 'any';
	let selectedTemporalStatus: 'all' | 'upcoming' | 'past' = 'all';
	let selectedSortOrder: 'asc' | 'desc' = 'asc';
	let showFilters = false;
	let fuse: Fuse<Event>;

	export let data: DiscoverPageData;
	// Use the server-side data
	$: publicEvents = data?.events || [];

	// Initialize Fuse.js with search options
	$: fuse = new Fuse(publicEvents, {
		keys: [
			{ name: 'name', weight: 0.7 },
			{ name: 'location', weight: 0.3 }
		],
		threshold: 0.3, // Lower threshold = more strict matching
		includeScore: true,
		includeMatches: true
	});

	// Filter events based on search query, event type, time filter, and temporal status
	$: filteredEvents = (() => {
		let events = publicEvents;

		// First filter by event type
		if (selectedEventType !== 'all') {
			events = events.filter((event) => event.type === selectedEventType);
		}

		// Then filter by temporal status (past/upcoming/all)
		if (selectedTemporalStatus !== 'all') {
			events = events.filter((event) => isEventInTimeRange(event, selectedTemporalStatus));
		}

		// Then filter by time range
		if (selectedTimeFilter !== 'any') {
			events = events.filter((event) => isEventInTimeRange(event, selectedTimeFilter));
		}

		// Then apply search query
		if (searchQuery.trim() !== '') {
			events = fuse.search(searchQuery).map((result) => result.item);
			// Re-apply all filters after search
			if (selectedEventType !== 'all') {
				events = events.filter((event) => event.type === selectedEventType);
			}
			if (selectedTemporalStatus !== 'all') {
				events = events.filter((event) => isEventInTimeRange(event, selectedTemporalStatus));
			}
			if (selectedTimeFilter !== 'any') {
				events = events.filter((event) => isEventInTimeRange(event, selectedTimeFilter));
			}
		}

		// Sort events by date and time
		events = events.sort((a, b) => {
			// Parse dates as local timezone to avoid timezone issues
			const parseEventDateTime = (event: Event) => {
				const [year, month, day] = event.date.split('-').map(Number);
				const [hours, minutes, seconds] = event.time.split(':').map(Number);
				return new Date(year, month - 1, day, hours, minutes, seconds || 0);
			};

			const dateA = parseEventDateTime(a);
			const dateB = parseEventDateTime(b);

			if (selectedSortOrder === 'asc') {
				return dateA.getTime() - dateB.getTime();
			} else {
				return dateB.getTime() - dateA.getTime();
			}
		});

		return events;
	})();
</script>

<svelte:head>
	<title>{t('discover.title')}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Main Content -->
	<div class="container mx-auto mt-8 flex-1 px-4 py-8 text-white">
		{#if error}
			<div class="mx-auto max-w-2xl text-center">
				<div class="mb-4 text-4xl">⚠️</div>
				<p class="py-4">{t('common.somethingWentWrong')}</p>
				<p class="text-red-600">{error}</p>
				<button
					on:click={() => goto('/')}
					class="rounded-sm border-2 border-violet-500 px-8 py-4 font-bold duration-400 hover:scale-110 hover:bg-violet-500/10"
				>
					{t('common.home')}
				</button>
			</div>
		{:else if publicEvents.length === 0}
			<div class="mx-auto max-w-2xl text-center">
				<div class="mb-4 animate-pulse text-6xl">🔍</div>
				<h2 class="mb-4 text-2xl font-bold">{t('discover.noPublicEventsTitle')}</h2>
				<p class="text-white-600 mb-8">
					{t('discover.noPublicEventsDescription')}
				</p>
				<button
					on:click={() => goto('/create')}
					class="rounded-sm border-2 border-violet-500 px-8 py-4 font-bold duration-400 hover:scale-110 hover:bg-violet-500/10"
				>
					{t('discover.createButton')}
				</button>
			</div>
		{:else}
			<div class="mx-auto max-w-4xl">
				<div class="mb-6">
					<h2 class="text-2xl font-bold text-slate-300">
						{t('discover.publicEventsTitle', { count: filteredEvents.length })}
					</h2>
					<p class="text-slate-500">{t('discover.publicEventsDescription')}</p>
				</div>

				<!-- Search and Filter Section -->
				<div class="mb-8 max-h-screen">
					<!-- Search Bar and Filter Toggle -->
					<div class="mx-auto flex w-full items-center gap-3 md:w-2/3">
						<div class="relative flex-1">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<svg
									class="h-5 w-5 text-slate-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									></path>
								</svg>
							</div>
							<input
								type="text"
								bind:value={searchQuery}
								placeholder={t('discover.searchPlaceholder')}
								class="w-full rounded-sm border border-slate-600 bg-slate-800 pl-10 text-white placeholder-slate-400 focus:border-violet-500 focus:ring-violet-500/20"
							/>
							{#if searchQuery}
								<button
									on:click={() => (searchQuery = '')}
									class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-300"
									aria-label={t('discover.searchInputAriaLabel')}
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										></path>
									</svg>
								</button>
							{/if}
						</div>

						<!-- Filter Toggle Button -->
						<button
							on:click={() => (showFilters = !showFilters)}
							class="flex items-center rounded-sm border p-3 font-semibold {showFilters
								? 'border-violet-500 bg-violet-400/20'
								: 'border-slate-600 bg-slate-800'}"
							aria-label={t('discover.toggleFiltersAriaLabel')}
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
								></path>
							</svg>
						</button>
					</div>

					<!-- Time Filter and Sort Controls -->
					{#if showFilters}
						<div
							class="mx-auto mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
						>
							<!-- Event Type Filter -->
							<div class="flex items-center gap-2">
								<label for="event-type-filter" class="text-sm font-medium text-slate-400"
									>{t('discover.typeFilterLabel')}</label
								>
								<select
									id="event-type-filter"
									bind:value={selectedEventType}
									class="rounded-sm border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
								>
									<option value="all">{t('discover.typeFilterAll')}</option>
									<option value="limited">{t('discover.typeFilterLimited')}</option>
									<option value="unlimited">{t('discover.typeFilterUnlimited')}</option>
								</select>
							</div>
							<!-- Temporal Status Filter -->
							<div class="flex items-center gap-2">
								<label for="temporal-status-filter" class="text-sm font-medium text-slate-400"
									>{t('discover.statusFilterLabel')}</label
								>
								<select
									id="temporal-status-filter"
									bind:value={selectedTemporalStatus}
									class="rounded-sm border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
								>
									<option value="all">{t('discover.statusFilterAll')}</option>
									<option value="upcoming">{t('discover.statusFilterUpcoming')}</option>
									<option value="past">{t('discover.statusFilterPast')}</option>
								</select>
							</div>
							<!-- Time Filter Dropdown -->
							<div class="flex items-center gap-2">
								<label for="time-filter" class="text-sm font-medium text-slate-400"
									>{t('discover.timeFilterLabel')}</label
								>
								<select
									id="time-filter"
									bind:value={selectedTimeFilter}
									class="rounded-sm border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
								>
									<option value="any">{t('discover.timeFilterAny')}</option>
									<option value="next-week">{t('discover.timeFilterNextWeek')}</option>
									<option value="next-month">{t('discover.timeFilterNextMonth')}</option>
								</select>
							</div>

							<!-- Sort Order Dropdown -->
							<div class="flex items-center gap-2">
								<label for="sort-order" class="text-sm font-medium text-slate-400"
									>{t('discover.sortOrderLabel')}</label
								>
								<select
									id="sort-order"
									bind:value={selectedSortOrder}
									class="rounded-sm border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
								>
									<option value="asc">{t('discover.sortOrderEarliest')}</option>
									<option value="desc">{t('discover.sortOrderLatest')}</option>
								</select>
							</div>
						</div>
					{/if}
				</div>

				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredEvents as event, i (i)}
						<div class="rounded-sm border border-slate-200 p-6 shadow-sm">
							<div class="mb-4">
								<h3 class="mb-2 text-xl font-bold text-slate-300">{event.name}</h3>
								<div class="space-y-2 text-sm text-slate-500">
									<div class="flex items-center space-x-2">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											></path>
										</svg>
										<span
											>{formatDate(event.date)} {t('common.atTime')} {formatTime(event.time)}</span
										>
									</div>
									<div class="flex items-center space-x-2">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											></path>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											></path>
										</svg>
										{#if event.location_type === 'none'}
											<span>N/A</span>
										{:else if event.location_type === 'maps' && event.location_url}
											<a
												href={event.location_url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-slate-500 transition-colors duration-200 hover:text-slate-300"
											>
												{t('create.locationMapsOption')}
											</a>
										{:else}
											<span>{event.location}</span>
										{/if}
									</div>
									<div class="flex items-center space-x-2">
										<span
											class="rounded-sm border px-2 py-1 text-xs font-medium {event.type ===
											'limited'
												? 'border-amber-600 text-amber-600'
												: 'border-teal-500 text-teal-500'}"
										>
											{event.type === 'limited' ? t('common.limited') : t('common.unlimited')}
										</span>
									</div>
									<div class="flex items-center space-x-2">
										<span
											class="rounded-sm border px-2 py-1 text-xs font-medium {event.visibility ===
											'public'
												? 'border-teal-500 text-teal-500'
												: 'border-amber-600 text-amber-600'}"
										>
											{event.visibility === 'public' ? t('common.public') : t('common.inviteOnly')}
										</span>
									</div>
								</div>
							</div>

							<div class="flex">
								<button
									on:click={() => goto(`/event/${event.id}`)}
									class="flex-1 rounded-sm border-2 border-violet-500 bg-violet-400/20 px-4 py-2 font-semibold duration-200 hover:bg-violet-400/70"
								>
									{t('discover.viewButton')}
								</button>
							</div>
						</div>
					{/each}
				</div>

				{#if searchQuery && filteredEvents.length === 0}
					<div class="mt-8 text-center">
						<div class="mb-4 text-4xl">🔍</div>
						<h3 class="mb-2 text-xl font-bold text-slate-300">
							{t('discover.noEventsFoundTitle')}
						</h3>
						<p class="text-slate-500">{t('discover.noEventsFoundDescription')}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
