import { database } from '$lib/database/db';
import { events, rsvps, inviteTokens } from '$lib/database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { isTokenValid } from '$lib/inviteTokenHelpers.js';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const eventId = params.id;
	const token = params.token;

	if (!eventId || !token) {
		throw error(404, 'Event or token not found');
	}

	try {
		// Fetch event, RSVPs, and invite token in parallel
		const [eventData, rsvpData, tokenData] = await Promise.all([
			database.select().from(events).where(eq(events.id, eventId)).limit(1),
			database.select().from(rsvps).where(eq(rsvps.eventId, eventId)).orderBy(asc(rsvps.createdAt)),
			database
				.select()
				.from(inviteTokens)
				.where(and(eq(inviteTokens.eventId, eventId), eq(inviteTokens.token, token)))
				.limit(1)
		]);

		if (!eventData[0]) {
			throw error(404, 'Event not found');
		}

		if (!tokenData[0]) {
			throw error(404, 'Invalid invite token');
		}

		const event = eventData[0];
		const eventRsvps = rsvpData;
		const inviteToken = tokenData[0];

		// Check if token is still valid
		if (!isTokenValid(inviteToken.expiresAt.toISOString())) {
			throw error(410, 'Invite token has expired');
		}

		// Check if event is invite-only
		if (event.visibility !== 'invite-only') {
			throw error(403, 'This event does not require an invite');
		}

		// Transform the data to match the expected interface
		const transformedEvent = {
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
			created_at: event.createdAt?.toISOString() || new Date().toISOString(),
			updated_at: event.updatedAt?.toISOString() || new Date().toISOString()
		};

		const transformedRsvps = eventRsvps.map((rsvp) => ({
			id: rsvp.id,
			event_id: rsvp.eventId,
			name: rsvp.name,
			user_id: rsvp.userId,
			created_at: rsvp.createdAt?.toISOString() || new Date().toISOString()
		}));

		const userId = cookies.get('cactoideUserId');

		return {
			event: transformedEvent,
			rsvps: transformedRsvps,
			userId: userId,
			inviteToken: {
				id: inviteToken.id,
				event_id: inviteToken.eventId,
				token: inviteToken.token,
				expires_at: inviteToken.expiresAt.toISOString(),
				created_at: inviteToken.createdAt?.toISOString() || new Date().toISOString()
			}
		};
	} catch (err) {
		if (err instanceof Response) throw err; // This is the 404/410/403 error

		console.error('Error loading invite-only event:', err);
		throw error(500, 'Failed to load event');
	}
};

export const actions: Actions = {
	addRSVP: async ({ request, params, cookies }) => {
		const eventId = params.id;
		const token = params.token;
		const formData = await request.formData();

		const name = formData.get('newAttendeeName') as string;
		const numberOfGuests = parseInt(formData.get('numberOfGuests') as string) || 0;
		const userId = cookies.get('cactoideUserId');

		if (!name?.trim() || !userId) {
			return fail(400, { error: 'Name and user ID are required' });
		}

		try {
			// Verify the invite token is still valid
			const [tokenData] = await database
				.select()
				.from(inviteTokens)
				.where(and(eq(inviteTokens.eventId, eventId), eq(inviteTokens.token, token)))
				.limit(1);

			if (!tokenData || !isTokenValid(tokenData.expiresAt.toISOString())) {
				return fail(403, { error: 'Invalid or expired invite token' });
			}

			// Check if event exists and get its details
			const [eventData] = await database.select().from(events).where(eq(events.id, eventId));
			if (!eventData) {
				return fail(404, { error: 'Event not found' });
			}

			// Get current RSVPs
			const currentRSVPs = await database.select().from(rsvps).where(eq(rsvps.eventId, eventId));

			// Calculate total attendees (including guests)
			const totalAttendees = currentRSVPs.length + numberOfGuests;

			// Check if event is full (for limited type events)
			if (eventData.type === 'limited' && eventData.attendeeLimit) {
				if (totalAttendees > eventData.attendeeLimit) {
					return fail(400, {
						error: `Event capacity exceeded. You're trying to add ${numberOfGuests + 1} attendees (including yourself), but only ${eventData.attendeeLimit - currentRSVPs.length} spots remain.`
					});
				}
			}

			// Check if name is already in the list
			if (currentRSVPs.some((rsvp) => rsvp.name.toLowerCase() === name.toLowerCase())) {
				return fail(400, { error: 'Name already exists for this event' });
			}

			// Prepare RSVPs to insert
			const rsvpsToInsert = [
				{
					eventId: eventId,
					name: name.trim(),
					userId: userId,
					createdAt: new Date()
				}
			];

			// Add guest entries
			for (let i = 1; i <= numberOfGuests; i++) {
				rsvpsToInsert.push({
					eventId: eventId,
					name: `${name.trim()}'s Guest #${i}`,
					userId: userId,
					createdAt: new Date()
				});
			}

			// Insert all RSVPs
			await database.insert(rsvps).values(rsvpsToInsert);

			return { success: true, type: 'add' };
		} catch (err) {
			console.error('Error adding RSVP:', err);
			return fail(500, { error: 'Failed to add RSVP' });
		}
	},

	removeRSVP: async ({ request, params, cookies }) => {
		const eventId = params.id;
		const token = params.token;
		const formData = await request.formData();

		const rsvpId = formData.get('rsvpId') as string;
		const userId = cookies.get('cactoideUserId');

		if (!rsvpId || !userId) {
			return fail(400, { error: 'RSVP ID and user ID are required' });
		}

		try {
			// Verify the invite token is still valid
			const [tokenData] = await database
				.select()
				.from(inviteTokens)
				.where(and(eq(inviteTokens.eventId, eventId), eq(inviteTokens.token, token)))
				.limit(1);

			if (!tokenData || !isTokenValid(tokenData.expiresAt.toISOString())) {
				return fail(403, { error: 'Invalid or expired invite token' });
			}

			// Check if RSVP exists and belongs to the user
			const [rsvpData] = await database
				.select()
				.from(rsvps)
				.where(and(eq(rsvps.id, rsvpId), eq(rsvps.eventId, eventId), eq(rsvps.userId, userId)))
				.limit(1);

			if (!rsvpData) {
				return fail(404, { error: 'RSVP not found or you do not have permission to remove it' });
			}

			// Delete the RSVP
			await database.delete(rsvps).where(eq(rsvps.id, rsvpId));

			return { success: true, type: 'remove' };
		} catch (err) {
			console.error('Error removing RSVP:', err);
			return fail(500, { error: 'Failed to remove RSVP' });
		}
	}
};
