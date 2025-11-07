import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/database/db';
import { events } from '$lib/database/schema';
import { desc, eq } from 'drizzle-orm';
import { logger } from '$lib/logger';

import { FEDERATION_INSTANCE } from '$env/static/private';

export const GET: RequestHandler = async () => {
	try {
		if (!FEDERATION_INSTANCE) {
			return json({ error: 'Federation API is not enabled on this instance' }, { status: 403 });
		}

		// Fetch all public and invite-only events ordered by creation date (newest first)
		const publicEvents = await database
			.select()
			.from(events)
			.where(eq(events.visibility, 'public'))
			.orderBy(desc(events.createdAt));

		// Transform events to include federation_event type
		const transformedEvents = publicEvents.map((event) => ({
			id: event.id,
			name: event.name,
			date: event.date,
			time: event.time,
			location: event.location,
			location_type: event.locationType,
			location_url: event.locationUrl,
			type: event.type,
			federation: true,
			attendee_limit: event.attendeeLimit,
			visibility: event.visibility,
			user_id: event.userId,
			created_at: event.createdAt?.toISOString() || '',
			updated_at: event.updatedAt?.toISOString() || ''
		}));

		return json({
			events: transformedEvents,
			count: transformedEvents.length
		});
	} catch (error) {
		logger.error({ error }, 'Error fetching events from API');
		return json(
			{
				error: 'Failed to fetch events',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
