import pino from 'pino';
import { env } from '$env/dynamic/private';

// ponytail: dynamic env so the build doesn't require these vars to be set
const USE_PRETTY_LOGS = env.LOG_PRETTY === 'true';

const transport = USE_PRETTY_LOGS
	? {
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'SYS:standard',
				ignore: 'pid,hostname'
			},
			customLevels: {
				trace: 10,
				debug: 20,
				info: 30,
				warn: 40,
				error: 50,
				fatal: 60
			}
		}
	: undefined;

export const logger = pino({
	level: env.LOG_LEVEL ?? 'info',
	transport
});

export type Logger = typeof logger;
