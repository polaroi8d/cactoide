import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/database/db';
import { events } from '$lib/database/schema';
import { eq, count } from 'drizzle-orm';
import { logger } from '$lib/logger';
import federationConfig from '$lib/config/federation.config.js';

import { FEDERATION_INSTANCE } from '$env/static/private';

export const GET: RequestHandler = async () => {
	try {
		if (!FEDERATION_INSTANCE) {
			return json({ error: 'Federation API is not enabled on this instance' }, { status: 403 });
		}
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
