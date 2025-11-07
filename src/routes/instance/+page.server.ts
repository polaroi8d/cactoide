import type { PageServerLoad } from './$types';
import { logger } from '$lib/logger';
import federationConfig from '../../../federation.config.js';

interface InstanceInfo {
	name: string;
	publicEventsCount: number;
}

interface HealthStatus {
	ok: boolean;
	responseTime?: number;
	responseTimeUnit?: string;
	error?: string;
}

interface InstanceData {
	url: string;
	name: string | null;
	events: number | null;
	healthStatus: 'healthy' | 'unhealthy' | 'unknown';
	responseTime: number | null;
	error?: string;
}

async function fetchInstanceInfo(instanceUrl: string): Promise<InstanceInfo | null> {
	try {
		const apiUrl = `http://${instanceUrl}/api/federation/info`;
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			logger.warn({ apiUrl, status: response.status }, 'Failed to fetch instance info');
			return null;
		}

		const data = (await response.json()) as InstanceInfo;
		return data;
	} catch (error) {
		logger.error(
			{ instanceUrl, error: error instanceof Error ? error.message : 'Unknown error' },
			'Error fetching instance info'
		);
		return null;
	}
}

async function fetchHealthStatus(instanceUrl: string): Promise<HealthStatus | null> {
	try {
		const apiUrl = `http://${instanceUrl}/api/healthz`;
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			logger.warn({ apiUrl, status: response.status }, 'Failed to fetch health status');
			return { ok: false, error: `HTTP ${response.status}` };
		}

		const data = (await response.json()) as HealthStatus;
		return data;
	} catch (error) {
		logger.error(
			{ instanceUrl, error: error instanceof Error ? error.message : 'Unknown error' },
			'Error fetching health status'
		);
		return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export const load: PageServerLoad = async () => {
	try {
		const instances = federationConfig.instances || [];

		// Fetch data from all instances in parallel
		const instanceDataPromises = instances.map(async (instance): Promise<InstanceData> => {
			const [info, health] = await Promise.all([
				fetchInstanceInfo(instance.url),
				fetchHealthStatus(instance.url)
			]);

			const responseTime = health?.responseTime ?? null;
			const healthStatus: 'healthy' | 'unhealthy' | 'unknown' = health?.ok
				? 'healthy'
				: health === null
					? 'unknown'
					: 'unhealthy';

			return {
				url: instance.url,
				name: info?.name ?? null,
				events: info?.publicEventsCount ?? null,
				healthStatus,
				responseTime,
				error: health?.error
			};
		});

		const instanceData = await Promise.all(instanceDataPromises);

		return {
			instances: instanceData
		};
	} catch (error) {
		logger.error({ error }, 'Error loading instance data');
		return {
			instances: []
		};
	}
};
