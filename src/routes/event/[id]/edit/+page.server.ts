import { database } from '$lib/database/db';
import { events, inviteTokens } from '$lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logger } from '$lib/logger';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const eventId = params.id;
	const userId = cookies.get('cactoideUserId');

	if (!userId) {
		throw redirect(303, '/');
	}

	// Fetch the event and verify ownership
	const event = await database
		.select()
		.from(events)
		.where(and(eq(events.id, eventId), eq(events.userId, userId)))
		.limit(1);

	if (event.length === 0) {
		throw redirect(303, '/event');
	}

	// Fetch invite token if this is an invite-only event
	let inviteToken = null;
	if (event[0].visibility === 'invite-only') {
		const tokenData = await database
			.select()
			.from(inviteTokens)
			.where(eq(inviteTokens.eventId, eventId))
			.limit(1);

		if (tokenData.length > 0) {
			inviteToken = {
				id: tokenData[0].id,
				event_id: tokenData[0].eventId,
				token: tokenData[0].token,
				expires_at: tokenData[0].expiresAt.toISOString(),
				created_at: tokenData[0].createdAt?.toISOString() || new Date().toISOString()
			};
		}
	}

	return {
		event: event[0],
		inviteToken,
		userId
	};
};

export const actions: Actions = {
	default: async ({ request, params, cookies }) => {
		const eventId = params.id;
		const userId = cookies.get('cactoideUserId');
		const formData = await request.formData();

		if (!userId) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Verify event ownership before allowing edit
		const existingEvent = await database
			.select()
			.from(events)
			.where(and(eq(events.id, eventId), eq(events.userId, userId)))
			.limit(1);

		if (existingEvent.length === 0) {
			return fail(403, { error: 'You can only edit your own events' });
		}

		const name = formData.get('name') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const location = formData.get('location') as string;
		const locationType = formData.get('location_type') as 'none' | 'text' | 'maps';
		const locationUrl = formData.get('location_url') as string;
		const type = formData.get('type') as 'limited' | 'unlimited';
		const attendeeLimit = formData.get('attendee_limit') as string;
		const visibility = formData.get('visibility') as 'public' | 'private';

		// Validation
		const missingFields: string[] = [];

		if (!name?.trim()) missingFields.push('name');
		if (!date) missingFields.push('date');
		if (!time) missingFields.push('time');
		if (!locationType) missingFields.push('location_type');
		if (locationType === 'text' && !location?.trim()) missingFields.push('location');
		if (locationType === 'maps' && !locationUrl?.trim()) missingFields.push('location_url');

		if (missingFields.length > 0) {
			return fail(400, {
				error: `Missing or empty fields: ${missingFields.join(', ')}`,
				values: {
					name,
					date,
					time,
					location,
					location_type: locationType,
					location_url: locationUrl,
					type,
					attendee_limit: attendeeLimit,
					visibility
				}
			});
		}

		// Check if date is in the past using local timezone (but allow editing past events for corrections)
		const [year, month, day] = date.split('-').map(Number);
		const eventDate = new Date(year, month - 1, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (eventDate < today) {
			return fail(400, {
				error: 'Date cannot be in the past.',
				values: {
					name,
					date,
					time,
					location,
					location_type: locationType,
					location_url: locationUrl,
					type,
					attendee_limit: attendeeLimit,
					visibility
				}
			});
		}

		if (type === 'limited' && (!attendeeLimit || parseInt(attendeeLimit) < 2)) {
			return fail(400, {
				error: 'Limit must be at least 2 for limited events.',
				values: {
					name,
					date,
					time,
					location,
					location_type: locationType,
					location_url: locationUrl,
					type,
					attendee_limit: attendeeLimit,
					visibility
				}
			});
		}

		// Update the event
		await database
			.update(events)
			.set({
				name: name.trim(),
				date: date,
				time: time,
				location: location?.trim() || '',
				locationType: locationType,
				locationUrl: locationType === 'maps' ? locationUrl?.trim() : null,
				type: type,
				attendeeLimit: type === 'limited' ? parseInt(attendeeLimit) : null,
				visibility: visibility,
				updatedAt: new Date()
			})
			.where(and(eq(events.id, eventId), eq(events.userId, userId)))
			.catch((error) => {
				logger.error({ error, eventId, userId }, 'Unexpected error updating event');
				throw error;
			});

		throw redirect(303, `/event/${eventId}`);
	}
};
