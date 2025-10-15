import { randomBytes } from 'crypto';

/**
 * Generates a secure random token for invite links
 * @param length - Length of the token (default: 32)
 * @returns A random hex string
 */
export function generateInviteToken(length: number = 32): string {
	return randomBytes(length / 2).toString('hex');
}

/**
 * Calculates the expiration time for an invite token
 * The token expires when the event starts
 * @param eventDate - The event date in YYYY-MM-DD format
 * @param eventTime - The event time in HH:MM:SS format
 * @returns ISO string of the expiration time
 */
export function calculateTokenExpiration(eventDate: string, eventTime: string): string {
	const eventDateTime = new Date(`${eventDate}T${eventTime}`);
	return eventDateTime.toISOString();
}

/**
 * Checks if an invite token is still valid
 * @param expiresAt - The expiration time as ISO string
 * @returns true if token is still valid, false otherwise
 */
export function isTokenValid(expiresAt: string): boolean {
	const now = new Date();
	const expiration = new Date(expiresAt);
	return now < expiration;
}
