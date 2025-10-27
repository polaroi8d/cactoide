import { database } from '$lib/database/db';
import { events, inviteTokens } from '$lib/database/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { generateInviteToken, calculateTokenExpiration } from '$lib/inviteTokenHelpers.js';

// Generate a random URL-friendly ID
function generateEventId(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const location = formData.get('location') as string;
		const locationType = formData.get('location_type') as 'none' | 'text' | 'maps';
		const locationUrl = formData.get('location_url') as string;
		const type = formData.get('type') as 'limited' | 'unlimited';
		const attendeeLimit = formData.get('attendee_limit') as string;
		const visibility = formData.get('visibility') as 'public' | 'private' | 'invite-only';
		const userId = cookies.get('cactoideUserId');

		// Validation
		const missingFields: string[] = [];

		if (!name?.trim()) missingFields.push('name');
		if (!date) missingFields.push('date');
		if (!time) missingFields.push('time');
		if (!locationType) missingFields.push('location_type');
		if (locationType === 'text' && !location?.trim()) missingFields.push('location');
		if (locationType === 'maps' && !locationUrl?.trim()) missingFields.push('location_url');
		if (!userId) missingFields.push('userId');

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

		// Check if date is in the past using local timezone
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

		const eventId = generateEventId();

		// Create the event
		await database
			.insert(events)
			.values({
				id: eventId,
				name: name.trim(),
				date: date,
				time: time,
				location: location?.trim() || '',
				locationType: locationType,
				locationUrl: locationType === 'maps' ? locationUrl?.trim() : null,
				type: type,
				attendeeLimit: type === 'limited' ? parseInt(attendeeLimit) : null,
				visibility: visibility,
				userId: userId!
			})
			.catch((error) => {
				console.error('Unexpected error', error);
				throw error;
			});

		// Generate invite token for invite-only events
		if (visibility === 'invite-only') {
			const token = generateInviteToken();
			const expiresAt = calculateTokenExpiration(date, time);

			await database
				.insert(inviteTokens)
				.values({
					eventId: eventId,
					token: token,
					expiresAt: new Date(expiresAt)
				})
				.catch((error) => {
					console.error('Error creating invite token', error);
					throw error;
				});
		}

		throw redirect(303, `/event/${eventId}`);
	}
};
