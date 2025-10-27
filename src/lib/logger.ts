import pino from 'pino';
import { LOG_PRETTY, LOG_LEVEL } from '$env/static/private';

const USE_PRETTY_LOGS = LOG_PRETTY === 'true';

const transport = USE_PRETTY_LOGS
	? {
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'SYS:standard',
				ignore: 'pid,hostname'
			}
		}
	: undefined;

export const logger = pino({
	level: LOG_LEVEL,
	transport
});

export type Logger = typeof logger;
