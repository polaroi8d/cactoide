<script lang="ts">
	import type { EventType, LocationType } from '$lib/types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/i18n.js';

	export let data;
	export let form;

	let eventData = {
		name: data.event.name,
		date: data.event.date,
		time: data.event.time,
		location: data.event.location,
		location_type: data.event.locationType || 'none',
		location_url: data.event.locationUrl || '',
		type: data.event.type,
		attendee_limit: data.event.attendeeLimit,
		visibility: data.event.visibility
	};

	let errors: Record<string, string> = {};
	let isSubmitting = false;
	let inviteToken = data.inviteToken;

	let showInviteLinkToast = false;
	let toastHideTimer: number | null = null;

	// Get today's date in YYYY-MM-DD format for min attribute
	const today = new Date().toISOString().split('T')[0];

	// Handle form errors from server
	$: if (form?.error) {
		errors.server = form.error;
	}

	// Pre-fill form with values from server on error
	$: if (form && 'values' in form && form.values) {
		const values = form.values;
		eventData = {
			...eventData,
			...values,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			attendee_limit: (values as any).attendee_limit
				? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					parseInt(String((values as any).attendee_limit))
				: null
		};
	}

	const handleTypeChange = (type: EventType) => {
		eventData.type = type;
		if (type === 'unlimited') {
			eventData.attendee_limit = null;
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
		goto(`/event/${data.event.id}`);
	};

	const copyInviteLink = async () => {
		if (inviteToken) {
			const inviteUrl = `${window.location.origin}/event/${data.event.id}/invite/${inviteToken.token}`;
			try {
				await navigator.clipboard.writeText(inviteUrl);
				showInviteLinkToast = true;

				// Auto-hide toast after 3 seconds
				if (toastHideTimer) clearTimeout(toastHideTimer);
				toastHideTimer = window.setTimeout(() => {
					showInviteLinkToast = false;
				}, 3000);
			} catch (err) {
				console.error('Failed to copy invite link:', err);
			}
		}
	};
</script>

<svelte:head>
	<title>{t('event.editTitle', { eventName: data.event.name })}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Main Content -->
	<div class="container mx-auto flex-1 px-4 py-8">
		<div class="mx-auto max-w-2xl">
			<!-- Event Edit Form -->
			<div class="rounded-sm border p-8">
				<div class="mb-8 text-center">
					<h2 class="text-3xl font-bold text-violet-400">{t('event.editEventTitle')}</h2>
					<p class="mt-2 text-sm text-slate-400">{t('event.editEventDescription')}</p>
				</div>

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
					{#if errors.server}
						<div class="mb-6 rounded-sm border border-red-200 bg-red-50 p-4 text-red-700">
							{errors.server}
						</div>
					{/if}

					<!-- Event Name -->
					<div>
						<label for="name" class="text-dark-800 mb-3 block text-sm font-semibold">
							{t('common.name')} <span class="text-red-400">{t('common.required')}</span>
						</label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={eventData.name}
							class="border-dark-300 w-full rounded-sm border-2 px-4 py-3 text-slate-900 shadow-sm"
							placeholder={t('common.enterEventName')}
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
								{t('common.date')} <span class="text-red-400">{t('common.required')}</span>
							</label>
							<input
								id="date"
								name="date"
								type="date"
								bind:value={eventData.date}
								min={today}
								class="border-dark-300 w-full rounded-sm border-2 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all duration-200"
								required
							/>
							{#if errors.date}
								<p class="mt-2 text-sm font-medium text-red-600">{errors.date}</p>
							{/if}
						</div>

						<div>
							<label for="time" class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('common.time')} <span class="text-red-400">{t('common.required')}</span>
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
							<p class="mt-2 text-xs text-slate-400">
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
								{t('common.type')} <span class="text-red-400">{t('common.required')}</span>
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
									{t('common.unlimited')}
								</button>
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.type ===
									'limited'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700 bg-gray-600/20 hover:bg-gray-600/70'}"
									on:click={() => handleTypeChange('limited')}
								>
									{t('common.limited')}
								</button>
							</div>
						</fieldset>
					</div>

					<!-- Limit (only for limited events) -->
					{#if eventData.type === 'limited'}
						<div>
							<label for="limit" class="text-dark-800 mb-3 block text-sm font-semibold">
								{t('common.attendeeLimit')} <span class="text-red-400">{t('common.required')}</span>
							</label>
							<input
								id="attendee_limit"
								name="attendee_limit"
								type="number"
								bind:value={eventData.attendee_limit}
								min="1"
								max="1000"
								class="border-dark-300 w-full rounded-sm border-2 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all duration-200"
								placeholder={t('common.enterLimit')}
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
								{t('common.visibility')} <span class="text-red-400">{t('common.required')}</span>
							</legend>
							<div class="grid grid-cols-3 gap-3">
								<button
									type="button"
									class="rounded-sm border-2 px-4 py-3 font-medium transition-all duration-200 {eventData.visibility ===
									'public'
										? ' border-violet-500 bg-violet-400/20 font-semibold hover:bg-violet-400/70'
										: 'border-dark-300 text-dark-700'}"
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
										? ' border-amber-500 bg-amber-400/20 font-semibold hover:bg-amber-400/70'
										: 'border-dark-300 text-dark-700 bg-gray-600/20 hover:bg-gray-600/70'}"
									on:click={() => (eventData.visibility = 'invite-only')}
								>
									{t('create.inviteOnlyOption')}
								</button>
							</div>
							<p class="mt-2 text-xs text-slate-400">
								{eventData.visibility === 'public'
									? t('create.publicDescription')
									: eventData.visibility === 'private'
										? t('create.privateDescription')
										: t('create.inviteOnlyDescription')}
							</p>
						</fieldset>
					</div>

					<!-- Invite Link Section (only for invite-only events and event creator) -->
					{#if eventData.visibility === 'invite-only' && inviteToken && data.event.userId === data.userId}
						<div class="rounded-sm border border-amber-500/30 bg-amber-900/20 p-4">
							<div class="mb-3 flex items-center justify-between">
								<h3 class="text-lg font-semibold text-amber-400">Invite Link</h3>
							</div>

							<div class="space-y-3">
								<div class="flex items-center space-x-2">
									<input
										type="text"
										value={`${window.location.origin}/event/${data.event.id}/invite/${inviteToken.token}`}
										readonly
										class="flex-1 rounded-sm border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
									/>
									<button
										type="button"
										on:click={copyInviteLink}
										class="rounded-sm border border-amber-300 bg-amber-200 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-300"
									>
										{t('event.copyInviteLinkButton')}
									</button>
								</div>
								<p class="text-xs text-amber-300">
									{t('event.inviteLinkExpiresAt', {
										time: new Date(inviteToken.expires_at).toLocaleString()
									})}
								</p>
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex space-x-3">
						<button
							type="button"
							on:click={handleCancel}
							class="flex-1 rounded-sm border-2 border-slate-300 bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-400 hover:text-slate-200"
						>
							{t('common.cancel')}
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="hover:bg-violet-400/70' flex-1 rounded-sm border-2 border-violet-500 bg-violet-400/20 px-4 py-3 font-bold font-medium font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105"
						>
							{#if isSubmitting}
								<div class="flex items-center justify-center">
									<div class="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
									{t('event.updatingEvent')}
								</div>
							{:else}
								{t('event.updateEventButton')}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<!-- Invite Link Toast -->
{#if showInviteLinkToast}
	<div
		class="fixed right-4 bottom-4 z-40 w-128 rounded-sm border border-yellow-500/30 bg-yellow-900/20 p-4 text-yellow-400"
	>
		{t('event.inviteLinkCopied')}
	</div>
{/if}
