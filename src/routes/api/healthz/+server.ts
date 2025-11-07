// src/routes/healthz/+server.ts
import { json } from '@sveltejs/kit';
import { database } from '$lib/database/db';
import { sql } from 'drizzle-orm';

export async function GET() {
	const startTime = performance.now();
	try {
		await database.execute(sql`select 1`);
		const responseTime = Math.round(performance.now() - startTime);
		return json(
			{ ok: true, responseTime, responseTimeUnit: 'ms' },
			{ headers: { 'cache-control': 'no-store' } }
		);
	} catch (err) {
		const responseTime = Math.round(performance.now() - startTime);
		return json(
			{
				ok: false,
				error: (err as Error)?.message,
				message: 'Database unreachable.',
				responseTime,
				responseTimeUnit: 'ms'
			},
			{ status: 503, headers: { 'cache-control': 'no-store' } }
		);
	}
}
