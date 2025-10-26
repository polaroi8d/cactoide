import { database } from '$lib/database/db';
import { events, rsvps } from '$lib/database/schema';
import { eq, asc } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const eventId = params.id;

	if (!eventId) {
		throw error(404, 'EventId not found');
	}

	try {
		// Fetch event and RSVPs in parallel
		const [eventData, rsvpData] = await Promise.all([
			database.select().from(events).where(eq(events.id, eventId)).limit(1),
			database.select().from(rsvps).where(eq(rsvps.eventId, eventId)).orderBy(asc(rsvps.createdAt))
		]);

		if (!eventData[0]) {
			throw error(404, 'Event not found');
		}

		const event = eventData[0];
		const eventRsvps = rsvpData;

		// Check if this is an invite-only event
		if (event.visibility === 'invite-only') {
			// For invite-only events, check if user is the event creator
			const userId = cookies.get('cactoideUserId');
			if (event.userId !== userId) {
				// User is not the creator, redirect to a message about needing invite
				throw error(403, 'This event requires an invite link to view');
			}
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
			userId: userId
		};
	} catch (err) {
		if (err instanceof Response) throw err; // This is the 404 error

		console.error('Error loading event:', err);
		throw error(500, 'Failed to load event');
	}
};

export const actions: Actions = {
	addRSVP: async ({ request, params, cookies }) => {
		const eventId = params.id;
		const formData = await request.formData();

		const name = formData.get('newAttendeeName') as string;
		const numberOfGuests = parseInt(formData.get('numberOfGuests') as string) || 0;
		const userId = cookies.get('cactoideUserId');

		if (!name?.trim() || !userId) {
			return fail(400, { error: 'Name and user ID are required' });
		}

		try {
			// Check if event exists and get its details
			const [eventData] = await database.select().from(events).where(eq(events.id, eventId));
			if (!eventData) {
				return fail(404, { error: 'Event not found' });
			}

			// Check if this is an invite-only event
			if (eventData.visibility === 'invite-only') {
				return fail(403, { error: 'This event requires an invite link to RSVP' });
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

	removeRSVP: async ({ request }) => {
		const formData = await request.formData();

		const rsvpId = formData.get('rsvpId') as string;

		if (!rsvpId) {
			return fail(400, { error: 'RSVP ID is required' });
		}

		try {
			await database.delete(rsvps).where(eq(rsvps.id, rsvpId));
			return { success: true, type: 'remove' };
		} catch (err) {
			console.error('Error removing RSVP:', err);
			return fail(500, { error: 'Failed to remove RSVP' });
		}
	}
};
