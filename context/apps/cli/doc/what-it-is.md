# CLI Context: DotAgents Mirror Tool

* [ ] The CLI is a command-line utility designed to provide AI settings synchronization in the background during development. It serves as a feature-complete mirror of the VSCode extension, ensuring consistency across different IDEs and terminal environments.

## Core Features (Parity with IDE Extension)

1. **Synchronization Orchestration**:

   - **Manual Sync**: Execute on-demand synchronization in both directions (`IDE → .agents` or `.agents → IDE`).
   - **Reactive Sync (Background Mode)**: A daemon-like service that watches for file changes in real-time, replicating the `IdeWatcherService` and `AgentsWatcherService` logic.
   - **Debouncing & Cooldown**: Intelligent sync management to prevent infinite loops and reduce unnecessary I/O.
2. **Agent & Tool Management**:

   - **Installation**: Fetch and install rules and agents from the central repository or local templates.
   - **Active Agent Configuration**: Dynamically switch the current "active" agent for the project.
   - **Rule Generation**: Automatic creation and opening of the `make_rule_prompt.md` template for custom tool definitions.
3. **Interactive User Interface (CLI Menu)**:

   - A command-line menu mirroring the IDE's quick-pick interface with the following actions:
     - `Synchronize Now`
     - `Add Agent/IDE Manually`
     - `Configure Active Agents`
     - `Generate Rules Prompt`

## Technical Principles

- **Architecture**: Follows Hexagonal (Ports and Adapters) and Slice Architecture. It reuses the same `Domain` and `Application` layers as the VSCode extension (`@dotagents/diff`, `@dotagents/rule`).
- **Infrastructure Adapters**: Implements specific terminal-based adapters for:
  - **I/O**: Console-based interactive prompts and progress indicators.
  - **Logging**: Colored terminal logs with file persistence for debugging.
  - **Watcher**: High-performance filesystem monitoring (e.g., via Bun or Node.js).
- **Environment Awareness**: Detects the host environment to provide tailored synchronization rules depending on whether it's running inside a specific IDE terminal or a standalone shell.
