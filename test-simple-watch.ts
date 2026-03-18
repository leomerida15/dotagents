/**
 * File watcher with automatic sync to .agents
 * Watches .opencode and .agents, and syncs changes
 *
 * Usage:
 *   bun run test-simple-watch.ts <base-path>
 *
 * Example:
 *   bun run test-simple-watch.ts ../../jobs/GobernAI/gbai
 */

import { watch, existsSync, FSWatcher, cpSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs';

// Base path
const BASE_PATH = resolve(process.argv[2] || '.');
const LOG_FILE = join(process.cwd(), '@simple-watch.log');

// Directories to watch
const WATCH_TARGETS = [join(BASE_PATH, '.agents'), join(BASE_PATH, '.opencode')].filter((p) =>
	existsSync(p),
);

if (WATCH_TARGETS.length === 0) {
	console.error(`Error: Neither .agents nor .opencode found in ${BASE_PATH}`);
	process.exit(1);
}

// Create log
writeFileSync(LOG_FILE, `=== Watch + Sync at ${new Date().toISOString()} ===\n`);

function log(message: string) {
	const timestamp = new Date().toISOString();
	const logLine = `${timestamp} ${message}\n`;
	appendFileSync(LOG_FILE, logLine);
	console.log(message);
}

log(`Base path: ${BASE_PATH}`);
log(`Watching: ${WATCH_TARGETS.join(', ')}`);

// Sync functions
function syncOpencodeToAgents() {
	log('=== SYNC: .opencode -> .agents ===');

	const source = join(BASE_PATH, '.opencode');
	const target = join(BASE_PATH, '.agents');

	// Sync rules
	const rulesSource = join(source, 'rules');
	const rulesTarget = join(target, 'rules');

	if (existsSync(rulesSource)) {
		try {
			mkdirSync(rulesTarget, { recursive: true });
			cpSync(rulesSource, rulesTarget, { recursive: true });
			log(`SYNC: rules/ copied to .agents/rules/`);
		} catch (err) {
			log(`SYNC ERROR rules: ${err}`);
		}
	}

	// Sync skills
	const skillsSource = join(source, 'skills');
	const skillsTarget = join(target, 'skills');

	if (existsSync(skillsSource)) {
		try {
			mkdirSync(skillsTarget, { recursive: true });
			cpSync(skillsSource, skillsTarget, { recursive: true });
			log(`SYNC: skills/ copied`);
		} catch (err) {
			log(`SYNC ERROR skills: ${err}`);
		}
	}

	// Sync commands
	const commandsSource = join(source, 'commands');
	const commandsTarget = join(target, 'workflows');

	if (existsSync(commandsSource)) {
		try {
			mkdirSync(commandsTarget, { recursive: true });
			cpSync(commandsSource, commandsTarget, { recursive: true });
			log(`SYNC: commands/ -> workflows/`);
		} catch (err) {
			log(`SYNC ERROR commands: ${err}`);
		}
	}

	log('=== SYNC COMPLETE ===');
}

// Initial sync
syncOpencodeToAgents();

// Set up watchers
process.on('uncaughtException', (err) => {
	log(`UNCAUGHT: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
	log(`REJECTION: ${reason}`);
});

const watchers: FSWatcher[] = [];

for (const target of WATCH_TARGETS) {
	try {
		const watcher = watch(target, { recursive: true }, (eventType, filename) => {
			if (filename) {
				log(`EVENT: ${eventType} - ${filename}`);
				// Trigger sync on any change
				syncOpencodeToAgents();
			}
		});
		watchers.push(watcher);
		log(`Started watching: ${target}`);
	} catch (err) {
		log(`ERROR watching ${target}: ${err}`);
	}
}

log('All watchers started, waiting for changes...');

process.on('SIGINT', () => {
	log('Stopping...');
	watchers.forEach((w) => w.close());
	process.exit(0);
});
