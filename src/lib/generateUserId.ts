export const generateUserId = () => {
	const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

	return userId;
};
