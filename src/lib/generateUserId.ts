import { randomUUID } from 'crypto';

// This id is the only credential the app has — it must not be guessable,
// and it must never be serialized to the client.
export const generateUserId = () => 'user_' + randomUUID();
