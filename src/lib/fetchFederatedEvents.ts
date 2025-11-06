import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '$lib/logger';
import type { Event } from '$lib/types';

import config from '../../federation.config.js';

console.log(config.instances);

interface FederationConfig {
	name: string;
	instances: Array<{ url: string }>;
}

interface FederationEventsResponse {
	events: Array<Event & { federation?: boolean }>;
	count?: number;
}

/**
 * Reads the federation config file
 */
async function readFederationConfig(): Promise<FederationConfig | null> {
	try {
		const configPath = join(process.cwd(), 'federation.config.js');

		// Use dynamic import to load the config file as a module
		// This is safer than eval and works with ES modules
		const configModule = await import(configPath + '?t=' + Date.now());
		const config = (configModule.default || configModule.config) as FederationConfig;

		if (config && config.instances && Array.isArray(config.instances)) {
			return config;
		}

		logger.warn('Invalid federation config structure');
		return null;
	} catch (error) {
		// If dynamic import fails, try reading as text and parsing
		try {
			const configPath = join(process.cwd(), 'federation.config.js');
			const configContent = readFileSync(configPath, 'utf-8');

			// Try to extract JSON-like structure
			const configMatch = configContent.match(/instances:\s*\[([\s\S]*?)\]/);
			if (configMatch) {
				// Simple parsing - extract URLs
				const urlMatches = configContent.matchAll(/url:\s*['"]([^'"]+)['"]/g);
				const instances = Array.from(urlMatches, (match) => ({ url: match[1] }));

				if (instances.length > 0) {
					return {
						name: 'Federated Instances',
						instances
					};
				}
			}
		} catch (fallbackError) {
			logger.error({ error: fallbackError }, 'Error parsing federation.config.js as fallback');
		}

		logger.error({ error }, 'Error reading federation.config.js');
		return null;
	}
}

/**
 * Fetches events from a single federated instance
 */
async function fetchEventsFromInstance(instanceUrl: string): Promise<Event[]> {
	try {
		// Ensure URL has protocol and append /api/events

		const apiUrl = `http://${instanceUrl}/api/events`;

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
	const config = await readFederationConfig();

	if (!config || !config.instances || config.instances.length === 0) {
		logger.debug('No federation config or instances found');
		return [];
	}

	logger.info(
		{ instanceCount: config.instances.length },
		'Fetching events from federated instances'
	);

	// Fetch from all instances in parallel
	const fetchPromises = config.instances.map((instance) => fetchEventsFromInstance(instance.url));

	const results = await Promise.all(fetchPromises);

	// Flatten all events into a single array
	const allFederatedEvents = results.flat();

	logger.info({ totalEvents: allFederatedEvents.length }, 'Completed fetching federated events');

	return allFederatedEvents;
}
