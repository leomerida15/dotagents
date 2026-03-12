# Config & Persistence Module

This module handles the storage and retrieval of both project-level configurations and CLI-specific preferences.

## Responsibilities
- Loading and saving the `.agents` manifest.
- Persisting CLI preferences (e.g., daemon settings, path aliases).
- Ensuring data integrity across synchronization cycles.

## Key Components
- **NodeConfigRepository**: Shared repository for project-level manifests.
- **CliPreferencesManager**: Handles user-specific CLI settings.
- **StatePersistenceProvider**: Manages transient state for long-running operations.
