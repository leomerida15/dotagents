# Logger & Debug Module

Provides specialized logging capabilities for the terminal environment, with enhanced support for debugging background daemon processes.

## Responsibilities
- Providing real-time, color-coded console output.
- Maintaining persistent log files for debugging the daemon mode.
- Formatting complex objects and errors for terminal displays.

## Key Components
- **CliLogger**: Terminal-optimized implementation of the application logger.
- **DaemonFileLogger**: Handles asynchronous logging to files for background tasks.
- **ErrorFormatter**: Standardizes error reporting across all CLI commands.
