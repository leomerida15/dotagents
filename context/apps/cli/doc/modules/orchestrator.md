# Orchestrator Module

The Orchestrator is the central hub of the CLI application, responsible for coordinating synchronization tasks and managing the overall application flow.

## Responsibilities
- Coordinating Use Cases from `@dotagents/diff` and `@dotagents/rule`.
- Managing synchronization sessions (Inbound/Outbound).
- Orchestrating multi-step management tasks (Add Agent, Initialize Project).

## Key Components
- **StartSyncOrchestration**: Orchestrates the initial and manual sync processes.
- **FetchAndInstallRules**: Handles the lifecycle of agent rule installation.
- **SyncSessionManager**: Manages the state and feedback of active sync operations.
