import { logger } from '$lib/logger';
import type { Event } from '$lib/types';

import config from '$lib/config/federation.config.js';

interface FederationEventsResponse {
	events: Array<Event & { federation?: boolean }>;
	count?: number;
}

/**
 * Fetches events from a single federated instance
 */
async function fetchEventsFromInstance(instanceUrl: string): Promise<Event[]> {
	try {
		const apiUrl = `http://${instanceUrl}/api/federation/events`;

		logger.debug({ apiUrl }, 'Fetching events from federated instance');

		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			logger.warn({ apiUrl, status: response.status }, 'Failed to fetch events from instance');
			return [];
		}

		const data = (await response.json()) as FederationEventsResponse;

		if (!data.events || !Array.isArray(data.events)) {
			logger.warn({ apiUrl }, 'Invalid events response structure');
			return [];
		}

		// Mark events as federated and add source URL
		const federatedEvents: Event[] = data.events.map((event) => ({
			...event,
			federation: true,
			federation_url: `http://${instanceUrl}`
		}));

		logger.info(
			{ apiUrl, eventCount: federatedEvents.length },
			'Successfully fetched federated events'
		);
		return federatedEvents;
	} catch (error) {
		logger.error(
			{ instanceUrl, error: error instanceof Error ? error.message : 'Unknown error' },
			'Error fetching events from instance'
		);
		return [];
	}
}

/**
 * Fetches events from all configured federated instances
 */
export async function fetchAllFederatedEvents(): Promise<Event[]> {
	if (!config || !config.instances || config.instances.length === 0) {
		logger.debug('No federation config or instances found');
		return [];
	}

	// Fetch from all instances in parallel
	const fetchPromises = config.instances.map((instance) => fetchEventsFromInstance(instance.url));

	const results = await Promise.all(fetchPromises);

	// Flatten all events into a single array
	const allFederatedEvents = results.flat();

	logger.info({ totalEvents: allFederatedEvents.length }, 'Completed fetching federated events');

	return allFederatedEvents;
}
