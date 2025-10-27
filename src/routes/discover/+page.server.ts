import { database } from '$lib/database/db';
import { desc, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { events } from '$lib/database/schema';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all non-private events (public and invite-only) ordered by creation date (newest first)
		const publicEvents = await database
			.select()
			.from(events)
			.where(inArray(events.visibility, ['public', 'invite-only']))
			.orderBy(desc(events.createdAt));

		// Transform the database events to match the expected Event interface
		const transformedEvents = publicEvents.map((event) => ({
			id: event.id,
			name: event.name,
			date: event.date, // Already in 'YYYY-MM-DD' format
			time: event.time, // Already in 'HH:MM:SS' format
			location: event.location,
			location_type: event.locationType,
			location_url: event.locationUrl,
			type: event.type,
			attendee_limit: event.attendeeLimit, // Note: schema uses camelCase
			visibility: event.visibility,
			user_id: event.userId, // Note: schema uses camelCase
			created_at: event.createdAt?.toISOString(),
			updated_at: event.updatedAt?.toISOString()
		}));

		return {
			events: transformedEvents
		};
	} catch (error) {
		console.error('Error loading public events:', error);

		// Return empty array on error to prevent page crash
		return {
			events: []
		};
	}
};
