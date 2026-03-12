# TUI (Terminal User Interface) Module

The TUI module handles all user interactions, providing a visual and interactive experience in the terminal that mirrors the VSCode extension's menu system.

## Responsibilities
- Displaying interactive menus for user actions.
- Providing visual status updates (spinners, progress bars).
- Handling user input and prompts.

## Key Components
- **InteractiveMenu**: The main action selector (replaces the VSCode QuickPick).
- **CliTerminalFeedback**: Visual components for displaying sync status and operation results.
- **PromptService**: Manages user questioning for manual configurations.
