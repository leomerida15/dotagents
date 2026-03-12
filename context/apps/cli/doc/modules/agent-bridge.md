# Agent Bridge Module

This module acts as the interface between the project and the various AI agents and IDEs installed on the host system.

## Responsibilities
- Automatically detecting active agents and host environments.
- Scanning the local file system for known agent configurations.
- Mapping terminal environments to specific synchronization contexts.

## Key Components
- **CliAgentScanner**: Locates and identifies available agents on the system.
- **CliAgentHostDetector**: Detects the host environment (e.g., specific terminal types, integrated shells).
- **AgentLinkManager**: Manages the manual linking process for unrecognized tools.
