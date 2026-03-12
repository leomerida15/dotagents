# Daemon Watcher Module

This module provides the "Background Mode" functionality, ensuring the CLI remains reactive to environment changes without user intervention.

## Responsibilities
- Monitoring the local project filesystem for synchronization needs.
- Monitoring external agent/IDE paths.
- Implementing debouncing and cooldown logic to ensure stability.

## Key Components
- **CliIdeWatcher**: Monitors host application paths.
- **CliAgentsWatcher**: Monitors the `.agents/` project folder.
- **DaemonLifecycleManager**: Manages starting, stopping, and status reporting of the background watcher process.
