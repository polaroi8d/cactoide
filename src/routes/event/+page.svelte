<script lang="ts">
	import type { Event } from '$lib/types';
	import { goto } from '$app/navigation';
	import { formatTime, formatDate } from '$lib/dateHelpers';
	import { t } from '$lib/i18n/i18n.js';

	export let data: { events: Event[] };

	let userEvents: Event[] = [];
	let currentUserId = '';
	let showDeleteModal = false;
	let eventToDelete: Event | null = null;

	// Use server-side data
	$: userEvents = data.events;

	function openDeleteModal(event: Event) {
		eventToDelete = event;
		showDeleteModal = true;
	}

	async function confirmDelete() {
		if (!eventToDelete) return;

		try {
			const eventId = eventToDelete.id;

			// Use server-side action for deletion
			const formData = new FormData();
			formData.append('eventId', eventId);
			formData.append('userId', currentUserId);

			const response = await fetch('?/deleteEvent', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				if (result.type === 'success') {
					showDeleteModal = false;
					eventToDelete = null;

					// ✅ Reload the page to reflect updated events
					location.reload();
				} else {
					alert(result.data?.error || 'Failed to delete event');
				}
			} else {
				alert('Failed to delete event. You may not have permission to delete this event.');
			}
		} catch (err) {
			alert(`An error occurred while deleting the event: ${err}`);
		}
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		eventToDelete = null;
	}
</script>

<svelte:head>
	<title>{t('event.myEventsTitle')}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Main Content -->
	<div class="container mx-auto mt-8 flex-1 px-4 py-8 text-white">
		{#if userEvents.length === 0}
			<div class="mx-auto max-w-2xl text-center">
				<div class="mb-4 animate-pulse text-6xl">🎉</div>
				<h2 class="mb-4 text-2xl font-bold">{t('event.noEventsYetTitle')}</h2>
				<p class="text-white-600 mb-8">
					{t('event.noEventsYetDescription')}
				</p>
				<button
					on:click={() => goto('/create')}
					class="rounded-sm border-2 border-violet-500 px-8 py-4 font-bold duration-400 hover:scale-110 hover:bg-violet-500/10"
				>
					{t('event.createYourFirstEventButton')}
				</button>
			</div>
		{:else}
			<div class="mx-auto max-w-4xl">
				<div class="mb-6">
					<h2 class="text-2xl font-bold text-slate-400">
						{t('event.myEventsTitle')} ({userEvents.length})
					</h2>
					<p class="text-slate-500">{t('event.myEventsDescription')}</p>
				</div>

				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each userEvents as event, i (i)}
						<div class="rounded-sm border border-slate-200 p-6 shadow-sm">
							<div class="mb-4">
								<div class="mb-3 flex items-center justify-between">
									<h3 class="text-xl font-bold text-slate-300">{event.name}</h3>
								</div>
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
												Google Maps
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
										<span
											class="rounded-sm border px-2 py-1 text-xs font-medium {event.visibility ===
											'public'
												? 'border-green-300 text-green-400'
												: 'border-orange-300 text-orange-400'}"
										>
											<!-- TODO(polaroi8d): replace with something better solution; message.json using this, beacuse of common.invite-only works here -->
											{t(`common.${event.visibility}`)}
										</span>
									</div>
									<div class="flex items-center space-x-2"></div>
								</div>
							</div>

							<div class="flex space-x-3">
								<button
									on:click={() => goto(`/event/${event.id}`)}
									class="flex-1 rounded-sm border-2 border-violet-500 bg-violet-400/20 px-4 py-2 font-semibold duration-200 hover:bg-violet-400/70"
									aria-label={t('event.viewEventAriaLabel')}
								>
									<svg
										class="mx-auto h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										></path>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										></path>
									</svg>
								</button>
								<button
									on:click={() => goto(`/event/${event.id}/edit`)}
									class="flex-1 rounded-sm border-2 border-blue-400 bg-blue-400/20 px-4 py-2 font-semibold text-white duration-200 hover:bg-blue-400/70"
									aria-label={t('event.editEventAriaLabel')}
								>
									<svg
										class="mx-auto h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										></path>
									</svg>
								</button>
								<button
									on:click={() => openDeleteModal(event)}
									class="flex-1 rounded-sm border-2 border-red-400 bg-red-400/20 px-4 py-2 font-semibold text-white duration-200 hover:bg-red-400/70"
									aria-label={t('event.deleteEventAriaLabel')}
								>
									<svg
										class="mx-auto h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										></path>
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && eventToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-sm border bg-slate-900/80 p-6">
			<div class="mb-6 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
				>
					<span class="text-2xl text-red-600">🗑️</span>
				</div>
				<h3 class="mb-2 text-xl font-bold text-white">{t('event.deleteEventTitle')}</h3>
				<p class="text-slate-400">
					{t('event.deleteEventDescription', { eventName: eventToDelete.name })}
				</p>
			</div>

			<div class="flex space-x-3">
				<button
					on:click={closeDeleteModal}
					class="flex-1 rounded-sm border-2 border-slate-300 bg-slate-200 px-4 py-2 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-300"
				>
					{t('common.cancel')}
				</button>
				<button
					on:click={confirmDelete}
					class="flex-1 rounded-sm border-2 border-red-500 bg-red-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-red-600"
				>
					{t('common.delete')}
				</button>
			</div>
		</div>
	</div>
{/if}
