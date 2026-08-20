import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async () => {
	if (env.PUBLIC_LANDING_INFO === 'false') {
		throw redirect(302, '/discover');
	}

	return {};
};
