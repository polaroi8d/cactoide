import { randomBytes } from 'crypto';

export const generateUserId = () => {
	const secureRandomString = randomBytes(8).toString('base36').substr(0, 9);
	const userId = 'user_' + Date.now() + '_' + secureRandomString;

	return userId;
};
