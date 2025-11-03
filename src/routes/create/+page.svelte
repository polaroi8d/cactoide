<script lang="ts">
	import type { CreateEventData, EventType, LocationType } from '$lib/types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/i18n.js';

	export let form;

	let eventData: CreateEventData = {
		name: '',
		date: '',
		time: '',
		location: '',
		location_type: 'none',
		location_url: '',
		type: 'unlimited',
		attendee_limit: undefined,
		visibility: 'public' as 'public' | 'private' | 'invite-only'
	};

	let errors: Record<string, string> = {};
	let isSubmitting = false;
	let currentUserId = '';

	// Get today's date in YYYY-MM-DD format for min attribute
	const today = new Date().toISOString().split('T')[0];

	// Handle form errors from server
	$: if (form?.error) {
		errors.server = form.error;
	}

	// Pre-fill form with values from server on error
	$: if (form?.values) {
		eventData = {
			...eventData,
			...form.values,
			attendee_limit: form.values.attendee_limit
				? parseInt(String(form.values.attendee_limit))
				: undefined
		};
	}

	const handleTypeChange = (type: EventType) => {
		eventData.type = type;
		if (type === 'unlimited') {
			eventData.attendee_limit = undefined;
		}
	};

	const handleLocationTypeChange = (locationType: LocationType) => {
		eventData.location_type = locationType;
		if (locationType === 'none') {
			eventData.location = '';
			eventData.location_url = '';
		} else if (locationType === 'text') {
			eventData.location_url = '';
			eventData.location = '';
		} else {
			eventData.location = 'Google Maps';
		}
	};

	const handleCancel = () => {
		goto(`/discover`);
	};
</script>

<svelte:head>
	<title>{t('create.title')}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Main Content -->
	<div class="container mx-auto flex-1 px-4 py-8">
		<div class="mx-auto max-w-2xl">
			<!-- Event Creation Form -->
			<div class="rounded-sm border p-8">
				<h2 class="mb-8 text-center text-3xl font-bold text-violet-400">{t('create.formTitle')}</h2>

				<form
					method="POST"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							if (result.type === 'failure') {
								// Handle validation errors
								if (result.data?.error) {
									errors.server = String(result.data.error);
								}
							}
							update();
						};
					}}
					class="space-y-6"
				>
					<input type="hidden" name="userId" value={currentUserId} />
					<input type="hidden" name="type" value={eventData.type} />
					<input type="hidden" name="visibility" value={eventData.visibility} />
					<input type="hidden" name="location_type" value={eventData.location_type} />

					{#if errors.server}
						<div class="mb-6 rounded-sm border border-red-200 bg-red-50 p-4 text-red-700">
							{errors.server}
						</div>
					{/if}

					<!-- Event Name -->
					<div>
						<label for="name" class="text-dark-800 mb-3 block text-sm font-semibold">
							{t('create.eventNameLabel')} <span class="text-red-400">{t('common.required')}</span>
						</label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={eventData.name}
							class="border-dark-300 w-full rounded-sm border-2 px-4 py-3 text-slate-900 shadow-sm"
							placeholder={t('create.eventNamePlaceholder')}
							maxlength="100"
							required
						/>
						{#if errors.name}
							<p class="mt-2 text-sm font-medium text-red-600">{errors.name}</p>
						{/if}
					</div>

					<!-- Date and Time Row -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="date" class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('create.dateLabel')} <span class="text-red-400">{t('common.required')}</span>
							</label>
							<input
								id="date"
								name="date"
								type="date"
								bind:value={eventData.date}
								min={today}
								class="border-dark-300 w-full rounded-sm border-2 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all duration-200"
								on:keydown={(e) => {
									if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
										e.preventDefault();
									}
								}}
								required
							/>
							{#if errors.date}
								<p class="mt-2 text-sm font-medium text-red-600">{errors.date}</p>
							{/if}
						</div>

						<div>
							<label for="time" class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('create.timeLabel')} <span class="text-red-400">{t('common.required')}</span>
							</label>
							<input
								id="time"
								name="time"
								type="time"
								bind:value={eventData.time}
								class="border-dark-300 w-full rounded-sm border-2 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all duration-200"
								required
							/>
							{#if errors.time}
								<p class="mt-2 text-sm font-medium text-red-600">{errors.time}</p>
							{/if}
						</div>
					</div>

					<!-- Location Type -->
					<div>
						<fieldset>
							<legend class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('create.locationTypeLabel')}
								<span class="text-red-400">{t('common.required')}</span>
							</legend>
							<div class="grid grid-cols-3 gap-3">
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.location_type ===
									'none'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700'}"
									on:click={() => handleLocationTypeChange('none')}
								>
									{t('create.locationNoneOption')}
								</button>
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.location_type ===
									'text'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700'}"
									on:click={() => handleLocationTypeChange('text')}
								>
									{t('create.locationTextOption')}
								</button>
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.location_type ===
									'maps'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700 bg-gray-600/20 hover:bg-gray-600/70'}"
									on:click={() => handleLocationTypeChange('maps')}
								>
									{t('create.locationMapsOption')}
								</button>
							</div>
							<p class="mt-2 text-xs text-slate-400 italic">
								{eventData.location_type === 'none'
									? t('create.locationNoneDescription')
									: eventData.location_type === 'text'
										? t('create.locationTextDescription')
										: t('create.locationMapsDescription')}
							</p>
						</fieldset>
					</div>

					<!-- Location Input (only show when not 'none') -->
					{#if eventData.location_type !== 'none'}
						<div>
							<label for="location" class="text-dark-800 mb-3 block text-sm font-semibold">
								{eventData.location_type === 'text'
									? t('create.locationLabel')
									: t('create.googleMapsUrlLabel')}
								<span class="text-red-400">{t('common.required')}</span>
							</label>
							{#if eventData.location_type === 'text'}
								<input
									id="location"
									name="location"
									type="text"
									bind:value={eventData.location}
									class="border-dark-300 placeholder-dark-500 w-full rounded-sm border-2 px-4 py-3 text-slate-900 shadow-sm transition-all"
									placeholder={t('create.locationPlaceholder')}
									maxlength="200"
									required
								/>
							{:else}
								<input
									id="location_url"
									name="location_url"
									type="url"
									bind:value={eventData.location_url}
									class="border-dark-300 placeholder-dark-500 w-full rounded-sm border-2 px-4 py-3 text-slate-900 shadow-sm transition-all"
									placeholder={t('create.googleMapsUrlPlaceholder')}
									maxlength="500"
									required
								/>
							{/if}
							{#if errors.location}
								<p class="mt-2 text-sm font-medium text-red-600">{errors.location}</p>
							{/if}
							{#if errors.location_url}
								<p class="mt-2 text-sm font-medium text-red-600">{errors.location_url}</p>
							{/if}
						</div>
					{/if}

					<!-- Event Type -->
					<div>
						<fieldset>
							<legend class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('create.typeLabel')}
								<span class="text-red-400">{t('common.required')}</span>
							</legend>
							<div class="grid grid-cols-2 gap-3">
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.type ===
									'unlimited'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700'}"
									on:click={() => handleTypeChange('unlimited')}
								>
									{t('create.unlimitedOption')}
								</button>
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.type ===
									'limited'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700 bg-gray-600/20 hover:bg-gray-600/70'}"
									on:click={() => handleTypeChange('limited')}
								>
									{t('create.limitedOption')}
								</button>
							</div>
						</fieldset>
					</div>

					<!-- Limit (only for limited events) -->
					{#if eventData.type === 'limited'}
						<div>
							<label for="limit" class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('create.attendeeLimitLabel')}
								<span class="text-red-400">{t('common.required')}</span>
							</label>
							<input
								id="attendee_limit"
								name="attendee_limit"
								type="number"
								bind:value={eventData.attendee_limit}
								min="1"
								max="1000"
								class="border-dark-300 w-full rounded-sm border-2 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all duration-200"
								placeholder={t('create.attendeeLimitPlaceholder')}
								required
							/>
							{#if errors.attendee_limit}
								<p class="mt-2 text-sm font-medium text-red-600">{errors.attendee_limit}</p>
							{/if}
						</div>
					{/if}

					<!-- Event Visibility -->
					<div>
						<fieldset>
							<legend class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('create.visibilityLabel')}
								<span class="text-red-400">{t('common.required')}</span>
							</legend>
							<div class="grid grid-cols-3 gap-3">
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.visibility ===
									'public'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700 bg-gray-600/20 hover:bg-gray-600/70'}"
									on:click={() => (eventData.visibility = 'public')}
								>
									{t('create.publicOption')}
								</button>
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.visibility ===
									'private'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700 bg-gray-600/20 hover:bg-gray-600/70'}"
									on:click={() => (eventData.visibility = 'private')}
								>
									{t('create.privateOption')}
								</button>
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.visibility ===
									'invite-only'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700 bg-gray-600/20 hover:bg-gray-600/70'}"
									on:click={() => (eventData.visibility = 'invite-only')}
								>
									{t('create.inviteOnlyOption')}
								</button>
							</div>
							<p class="mt-2 text-xs text-slate-400 italic">
								{eventData.visibility === 'public'
									? t('create.publicDescription')
									: eventData.visibility === 'private'
										? t('create.privateDescription')
										: 'Event is public but requires a special invite link to attend'}
							</p>
						</fieldset>
					</div>

					<div class="flex space-x-3">
						<button
							type="button"
							on:click={handleCancel}
							class="flex-1 rounded-sm border-2 border-slate-300 bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-400 hover:text-slate-200"
						>
							{t('common.cancel')}
						</button>
						<!-- Submit Button -->
						<button
							type="submit"
							disabled={isSubmitting}
							class="hover:bg-violet-400/70'l flex-2 rounded-sm border-2 border-violet-500 bg-violet-400/20 px-4 py-3 py-4 font-bold font-medium font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105"
						>
							{#if isSubmitting}
								<div class="flex items-center justify-center">
									<div class="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
									{t('create.creatingEvent')}
								</div>
							{:else}
								{t('create.createEventButton')}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
