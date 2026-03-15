/**
 * MCP Server Entry Point
 * Starts the DotAgents Monitor MCP server.
 */

import { MonitorModule } from './modules/monitor/MonitorModule';

/**
 * Get configuration from environment.
 */
function getConfig() {
	return {
		projectRoot: process.env.MONITOR_PROJECT_ROOT ?? process.cwd(),
		databasePath: process.env.MONITOR_DB_PATH ?? './context/monitor/monitor.db',
	};
}

/**
 * Main entry point.
 */
async function main() {
	const config = getConfig();

	console.error('Starting DotAgents Monitor MCP Server...');
	console.error(`Project root: ${config.projectRoot}`);
	console.error(`Database: ${config.databasePath}`);

	try {
		const server = await MonitorModule.createMcpServer({
			projectRoot: config.projectRoot,
			databasePath: config.databasePath,
		});

		// Start the server
		await server.start();

		// Handle graceful shutdown
		process.on('SIGINT', async () => {
			console.error('\nShutting down...');
			await server.stop();
			process.exit(0);
		});

		process.on('SIGTERM', async () => {
			console.error('\nShutting down...');
			await server.stop();
			process.exit(0);
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main) {
	main();
}
