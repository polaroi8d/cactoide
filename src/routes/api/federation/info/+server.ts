import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/database/db';
import { events } from '$lib/database/schema';
import { eq, count } from 'drizzle-orm';
import { logger } from '$lib/logger';
import federationConfig from '../../../../../federation.config.js';

export const GET: RequestHandler = async () => {
	try {
		// Count public events
		const publicEventsCount = await database
			.select({ count: count() })
			.from(events)
			.where(eq(events.visibility, 'public'));

		const countValue = publicEventsCount[0]?.count || 0;

		return json({
			name: federationConfig.name,
			publicEventsCount: countValue
		});
	} catch (error) {
		logger.error({ error }, 'Error fetching federation info from API');
		return json(
			{
				error: 'Failed to fetch federation info',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

