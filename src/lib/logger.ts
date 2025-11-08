import pino from 'pino';
import { LOG_PRETTY, LOG_LEVEL } from '$env/static/private';

try {
	if (LOG_PRETTY && LOG_LEVEL) {
		console.debug(
			`Initializing logger with pretty logs: LOG_PRETTY: ${LOG_PRETTY} and LOG_LEVEL: ${LOG_LEVEL}`
		);
	}
} catch (error) {
	console.error('Error initializing logger', error);
}

const USE_PRETTY_LOGS = LOG_PRETTY === 'true';

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
	level: LOG_LEVEL,
	transport
});

export type Logger = typeof logger;
