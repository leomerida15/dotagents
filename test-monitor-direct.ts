/**
 * Test script for @dotagents/monitor
 * Direct file watcher test - no filters
 *
 * Usage:
 *   bun run /var/home/snor/Documents/libs/dotagents/test-monitor-direct.ts <path>
 */

import { FsFileWatcher } from './packages/monitor/src/modules/monitor/infra/adapters/FsFileWatcher.ts';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const WATCH_PATH = resolve(process.argv[2] || '.');
const LOG_FILE = join(WATCH_PATH, 'monitor-test.log');

writeFileSync(LOG_FILE, `=== Direct Watch Test at ${new Date().toISOString()} ===\n`);

function log(message: string) {
	const timestamp = new Date().toISOString();
	const logLine = `${timestamp} ${message}\n`;
	appendFileSync(LOG_FILE, logLine);
	console.log(message);
}

async function main() {
	log(`Watching: ${WATCH_PATH}`);

	const watcher = new FsFileWatcher();

	const obs = watcher.watch({
		path: WATCH_PATH,
		recursive: true,
	});

	log('Watcher started, waiting for events...');

	obs.subscribe({
		next: (event) => {
			log(`EVENT: ${event.type} - ${event.path}`);
		},
		error: (err) => {
			log(`ERROR: ${err.message}`);
		},
	});

	process.on('SIGINT', () => {
		log('Stopping...');
		process.exit(0);
	});
}

main().catch((err) => {
	log(`FATAL: ${err.message}`);
	process.exit(1);
});
