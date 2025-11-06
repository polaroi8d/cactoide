// src/routes/healthz/+server.ts
import { json } from '@sveltejs/kit';
import { database } from '$lib/database/db';
import { sql } from 'drizzle-orm';

export async function GET() {
	try {
		await database.execute(sql`select 1`);
		return json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
	} catch (err) {
		return json(
			{ ok: false, error: (err as Error)?.message, message: 'Database unreachable.' },
			{ status: 503, headers: { 'cache-control': 'no-store' } }
		);
	}
}
