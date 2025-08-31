// src/routes/healthz/+server.ts
import { json } from '@sveltejs/kit';
import { drizzleQuery } from '$lib/database/db';
import { sql } from 'drizzle-orm';

export async function GET() {
	try {
		await drizzleQuery.execute(sql`select 1`);
		return json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
	} catch (err) {
		return json(
			{ ok: false, error: (err as Error)?.message ?? 'DB unavailable' },
			{ status: 503, headers: { 'cache-control': 'no-store' } }
		);
	}
}
