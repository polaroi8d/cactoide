// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { generateUserId } from '$lib/generateUserId.js';
import { ensureDatabaseConnection } from '$lib/database/healthCheck';
import { logger } from '$lib/logger';

// Global flag to track if database health check has been performed
let dbHealthCheckPerformed = false;

export const handle: Handle = async ({ event, resolve }) => {
	// Perform database health check only once during application startup
	if (!dbHealthCheckPerformed) {
		try {
			await ensureDatabaseConnection({
				maxRetries: 3,
				baseDelay: 1000,
				maxDelay: 10000,
				timeout: 5000
			});
			dbHealthCheckPerformed = true;
		} catch (error) {
			logger.error({ error }, 'Database health check failed');
			// The ensureDatabaseConnection function will exit the process
			// if the database is unavailable, so this catch is just for safety
			process.exit(1);
		}
	}

	const cactoideUserId = event.cookies.get('cactoideUserId');
	const userId = generateUserId();

	const DAYS = 400; // practical upper bound in many browsers for cookies
	const MAX_AGE = 60 * 60 * 24 * DAYS;
	const PATH = '/';

	if (!cactoideUserId) {
		logger.debug({ userId }, 'No cactoideUserId cookie found, generating new one');
		event.cookies.set('cactoideUserId', userId, { path: PATH, maxAge: MAX_AGE });
	} else {
		logger.debug({ cactoideUserId }, 'cactoideUserId cookie found, using existing one');
	}

	return resolve(event);
};
