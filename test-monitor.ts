/**
 * Test script for @dotagents/monitor
 * Watches a directory and logs file changes to a .log file
 *
 * Usage:
 *   bun run test-monitor.ts <path-to-watch>
 *
 * Examples:
 *   bun run test-monitor.ts .                    # Watch current directory
 *   bun run test-monitor.ts ../GobernAI/gbai    # Watch GobernAI/gbai
 *
 * The script stays active as a daemon until Ctrl+C
 */

import { MonitorModule } from './packages/monitor/src/index.ts';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Get path from command line argument or use current directory
const WATCH_PATH = resolve(process.argv[2] || '.');
const LOG_FILE = join(WATCH_PATH, 'monitor-test.log');
const DB_PATH = join(WATCH_PATH, 'context', 'monitor');

// Ensure database directory exists
if (!existsSync(DB_PATH)) {
	mkdirSync(DB_PATH, { recursive: true });
}

// Clear log file
writeFileSync(LOG_FILE, `=== Monitor Test Started at ${new Date().toISOString()} ===\n`);

function log(message: string) {
	const timestamp = new Date().toISOString();
	const logLine = `${timestamp} ${message}\n`;
	appendFileSync(LOG_FILE, logLine);
	console.log(message);
}

async function main() {
	log(`=== Watching: ${WATCH_PATH} ===`);
	log('Initializing Monitor Module...');

	const useCases = await MonitorModule.createUseCases({
		projectRoot: WATCH_PATH,
		databasePath: `${WATCH_PATH}/context/monitor/monitor.db`,
	});

	const { watchDirectory, getEvents } = useCases;

	log('Starting directory watch...');

	// Watch the specified directory - capture all events
	const result = await watchDirectory.execute({
		path: WATCH_PATH,
		recursive: true,
		include: [],
		exclude: ['node_modules', '.git', '*.log'],
		respectGitignore: false,
		debounceMs: 100,
	});

	log(`Watch started with ID: ${result.watchId}`);
	log(`Watching: ${WATCH_PATH}`);
	log('Any file change will be logged to monitor-test.log');
	log('Press Ctrl+C to stop\n');

	// Poll for new events
	let lastEventCount = 0;
	const pollInterval = setInterval(async () => {
		try {
			const events = await getEvents.execute({
				limit: 20,
				offset: 0,
				types: ['CREATED', 'MODIFIED', 'DELETED', 'RENAMED'],
			});

			if (events.events && events.events.length > lastEventCount) {
				for (let i = lastEventCount; i < events.events.length; i++) {
					const event = events.events[i];
					if (event) {
						log(`EVENT: ${event.type} - ${event.path}`);
					}
				}
				lastEventCount = events.events.length;
			}
		} catch (e) {
			// Ignore polling errors
		}
	}, 1000);

	// Keep process running
	process.on('SIGINT', async () => {
		clearInterval(pollInterval);
		log('\nStopping monitor...');
		result.unwatch();
		log('Monitor stopped.');
		process.exit(0);
	});
}

main().catch((err) => {
	log(`ERROR: ${err.message}`);
	console.error(err);
	process.exit(1);
});
