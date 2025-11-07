import { database } from '$lib/database/db';
import { desc, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { events } from '$lib/database/schema';
import { logger } from '$lib/logger';
import { fetchAllFederatedEvents } from '$lib/fetchFederatedEvents';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all non-private events ordered by creation date (newest first)
		const publicEvents = await database
			.select()
			.from(events)
			.where(inArray(events.visibility, ['public', 'invite-only']))
			.orderBy(desc(events.createdAt));

		// Transform the database events to match the expected Event interface
		const transformedEvents = publicEvents.map((event) => ({
			id: event.id,
			name: event.name,
			date: event.date,
			time: event.time,
			location: event.location,
			location_type: event.locationType,
			location_url: event.locationUrl,
			type: event.type,
			attendee_limit: event.attendeeLimit,
			visibility: event.visibility,
			user_id: event.userId,
			created_at: event.createdAt?.toISOString(),
			updated_at: event.updatedAt?.toISOString(),
			federation: false // Add false for local events
		}));

		// Fetch federated events from federation.config.js
		let federatedEvents: typeof transformedEvents = [];
		try {
			federatedEvents = await fetchAllFederatedEvents();
		} catch (error) {
			logger.error({ error }, 'Error fetching federated events, continuing with local events only');
		}

		// Merge local and federated events
		const allEvents = [...transformedEvents, ...federatedEvents];

		return {
			events: allEvents
		};
	} catch (error) {
		logger.error({ error }, 'Error loading events');

		// Return empty array on error to prevent page crash
		return {
			events: []
		};
	}
};
