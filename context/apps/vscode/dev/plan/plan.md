# VSCode Extension Development Plan (Rootmap)

This plan outlines the milestones to finalize `apps/vscode`, integrating it with the project's core packages.

---

## 🚀 Sprint 1: Real Core Orchestration
**Status**: 🟢 Completed

- **Context**: The extension currently uses a mock in `StartSyncOrchestration`. We need to connect the actual `@dotagents/diff` engine.
- **Dependencies**: Foundation Architecture (Completed).
- **Steps to Execute**:
    1. Implement Infrastructure Adapters to interact with `@dotagents/diff`. [x]
    2. Inject the real sync engine into the orchestrator. [x]
    3. Ensure robust error handling for file system operations. [x]

### Checklist
- [x] `@dotagents/diff` is correctly called from "Sync Now" command.
- [x] Files are actually synchronized between IDE folders and `.agents/`.

---

## 🚀 Sprint 2: Environment Auto-Discovery
**Status**: 🟢 Completed

- **Context**: The extension must detect installed agents without manual user intervention.
- **Dependencies**: Sprint 1 (to be able to sync what is found).
- **Steps to Execute**:
    1. Create `EnvironmentDetector` to scan for folders like `.cursor/`, `.cline/`, `.agent/`. [x]
    2. Integrate scan results into the `AgentBridgeState`. [x]
    3. Load icons, colors, and names dynamically from `@dotagents/rule` metadata.

### Checklist
- [x] Successful discovery of at least 3 common agents upon VSCode startup.
- [ ] UI reflects detected agents with their respective corporate colors/icons.

---

## 🚀 Sprint 3: The Reactive Watcher
**Status**: 🔵 To Do

- **Context**: The Watcher enables "magic" (automatic) synchronization.
- **Dependencies**: Sprint 2 (needs to know which paths to watch).
- **Steps to Execute**:
    1. Implement `VSCodeWatcher` using the VSCode API.
    2. Configure exclusion patterns to prevent sync loops.
    3. Implement a visual "heartbeat" in the StatusBar that pulses during auto-sync.

### Checklist
- [ ] Saving a file in an agent folder triggers sync to `.agents/`.
- [ ] Infinitesimal sync loops are prevented via debouncing/filtering.

---

## 🚀 Sprint 4: Global Distribution & Skill Mode
**Status**: 🟡 In Progress

- **Context**: Finalize connection with the rule repository and enable agent self-configuration.
- **Dependencies**: All previous sprints.
- **Steps to Execute**:
    1. Link `AddAgentManually` with the `packages/rule` API (Local/GitHub).
    2. Implement `Generate Rule Prompt` command to copy skill markdown to clipboard.
    3. Final UI/UX polish and timestamp conflict handling.

### Checklist
- [x] Manual agent list is fetched from Rule Repository (GitHub/Local).
- [ ] Generated prompt includes correct instructions for AI self-configuration.
