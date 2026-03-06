# Report: Current behaviour vs. intended design

**Date:** 2025-02-22  
**Scope:** DotAgents VSCode extension / CLI — tool detection flow and bidirectional sync

> **Recent changes (Agent Host Detector roadmap):** Default value `vscode`; `WORKSPACE_KNOWN_AGENTS` only includes agents with rules on GitHub (antigravity, cursor); dynamic detection via loop; notification when IDE is not recognised with Add Agent / Open make_rule.md options; placeholder in selector for IDEs not in the list. Roadmap: `context/apps/vscode/dev/agent-host-detector/` (status.md).
>
> **Recent changes (Tool Change Sync roadmap):** `syncNew(workspaceRoot, agentId)` runs outbound + inbound (full sync). After changing tool via selector or when adding an agent manually, `syncNew` runs if rules exist; ignoredPaths and cooldowns avoid loops. Add Agent Manually adds agent to config, persists currentAgent and triggers syncNew. Roadmap: `context/apps/vscode/dev/tool-change-sync/` (status.md).
>
> **Recent changes (Known Agents from Rules roadmap):** `WORKSPACE_KNOWN_AGENTS` is generated at build from `rules/*.yaml` (WorkspaceAgents.generated.ts). At runtime the selector includes agents from `.agents/.ai/rules/*.yaml` (custom rules) merged without duplicates. Add Agent Manually uses the same dynamic list (known + custom) and "Custom..." option. Roadmap: `context/apps/vscode/dev/known-agents-from-rules/` (status.md).

---

## 1. Executive summary

This document describes the current behaviour of the DotAgents extension and contrasts it with the intended design to support multiple tools (IDEs, extensions, TUIs) with explicit active-tool selection, reactive file watchers, and manual bidirectional sync.

---

## 2. Intended specification

### 2.1 8-step flow

| # | Requirement | Description |
| - | ----------- | ----------- |
| 1 | **Init on open** | On IDE open, detect if `.agents` and `.agents/.ai` exist; if not, create them. |
| 2 | **Tool selector** | Detect IDE name and show a select list with default check on current IDE. Allow tools other than the IDE (opencode CLI, Cline extension, etc.). |
| 3 | **Rules evaluation** | If rules exist for the tool → download them to `.agents/.ai/rules`. If not → tell the user to create them with `make_rule.md` and save under `.agents/.ai/rules/{{IDE}}.yaml`. Rules are defined in **YAML**. |
| 4 | **File watchers IDE ↔ .agents** | Watch for file changes in the IDE and in `.agents`. On change → update `.agents` and `.agents/.ai/state.json`. Only touch files that actually changed. |
| 5 | **Sync .agents → IDE** | When something in `.agents` changes, apply rules to bring changes from the bridge to the selected tool. |
| 6 | **Manual sync** | Trigger sync manually: ask for IDE and direction (`.agents` → IDE or IDE → `.agents`). |
| 7 | **Menu: change tool** | Allow changing the active tool from the extension menu. |
| 8 | **Different tool on open** | When opening an IDE whose name differs from `manifest.currentAgent`, always ask which tool to use. |

**Rules format:** Per-tool rules are defined in **YAML** (`.yaml` files in `.agents/.ai/rules/`).

### 2.2 Intended `state.json` structure

- **manifest**: active tool (`currentAgent`), per-tool timestamps (`lastProcessedAt`) to know which is most up to date.
- **agents**: array for the select list with UI names (`id`, `name`, `sourceRoot`).

### 2.3 Ideal scenario

For a complete tool-switch experience, the extension should provide:

1. **Manual tool change**: An explicit way to set the active tool (e.g. menu or project option), persisted in `manifest.currentAgent`.
2. **Forced selection when opening a different IDE**: If on workspace open the current IDE is different from `manifest.currentAgent`, the extension must force tool selection before continuing, instead of assuming the previous tool.

### 2.4 Business rules: tool and rules

The flow must respect these mandatory conditions:

| Status | Requirement | Description |
| ------ | ----------- | ----------- |
| ✅ | **Tool must be defined** | Do not proceed (no migrate, no sync) until the user has selected a tool. If they cancel or do not select, wait without running migration or sync. |
| ❌ | **Step 2 = selection + rules download** | After choosing tool → download its rules to `.agents/.ai/rules/{agentId}.yaml`. Downloaded rules are used for sync and migration. |
| ❌ | **Sync only with local rules** | Do not run sync or migration if `.agents/.ai/rules/{agentId}.yaml` does not exist for the active tool. Do not use `DEFAULT_MIGRATION_RULES`. |
| ⚠️ | **Rules missing on GitHub** | Notification with `make_rule.md` is implemented. Pending: block sync until rules exist locally. |

*Status legend: ✅ Done | ❌ Pending | ⚠️ Partial*

**Summary order:** tool defined → rules local → sync/migration.

---

## 3. Current behaviour

### 3.1 Initialisation (Requirement 1)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Create `.agents` if missing | ✅ | `InitializeProjectUseCase` creates the structure via `NodeConfigRepository.save()`. |
| Create `.agents/.ai` if missing | ✅ | `NodeConfigRepository.save()` and `ensureAIStructure()` create `.agents/.ai` and `.agents/.ai/rules`. |
| Check `state.json` on open | ✅ | If missing, flow uses selector/init; if `currentAgent` is null or ≠ `hostAgentId`, selector opens. |
| When it runs | ✅ | Only when a workspace is open; `onDidChangeWorkspaceFolders` is used if no folder on activate. |

**Files:** `extension.ts` (instantiates `InitializeProjectUseCase`), `NodeConfigRepository.ts`, `StartSyncOrchestration.ts` (calls `initializeProject.execute()` and `ensureAIStructure()`).

**Roadmap:** See `context/apps/vscode/dev/core-engine-integration/` for sprints and detailed status (Sprint 1: Initialisation).

---

### 3.2 Tool selector (Requirement 2)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Dialog/select list to choose tool | ✅ | QuickPick in `selectActiveAgent()` with dynamic list: `WORKSPACE_KNOWN_AGENTS` (build from `rules/`) + agents from `.agents/.ai/rules/*.yaml` (custom rules), no duplicates. |
| IDE detection | ✅ | `detectAgentFromHostApp()` loops over `WORKSPACE_KNOWN_AGENTS`; fallback `"vscode"` if no match. |
| User selection | ✅ | User picks in QuickPick; `currentAgent` and `lastActiveAgent` are persisted in `.agents/.ai/state.json`. |
| Default check on current IDE | ✅ | IDE host or `manifest.currentAgent` is preselected by priority. |
| Open selector if currentAgent ≠ hostAgentId | ✅ | If `currentAgent` is null or different from `hostAgentId`, selector opens before continuing (Requirement 8). |
| Placeholder for unrecognised IDE | ✅ | If `hostAgentId === 'vscode'` and `!isHostIdeRecognized()`, placeholder: "Your IDE ({appName}) is not in the list. Use Add Agent Manually…". |
| Add Agent Manually (dynamic list) | ✅ | List = known (WORKSPACE_KNOWN_AGENTS) + custom rules; "Custom..." option. On add, agent is persisted in config and `syncNew` runs if local rules exist. |

**Files:** `extension.ts`, `AgentHostDetector.ts`, `DiffSyncAdapter.ts`, `StartSyncOrchestration.ts`

---

### 3.3 Rules evaluation (Requirement 3)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Download rules from repo | ✅ | `FetchAndInstallRulesUseCase` fetches rules from GitHub and saves to `.agents/.ai/rules/{agentId}.yaml`. |
| Check rules exist per tool | ✅ | `GetMissingRulesAgentIdsUseCase` uses `VerifyRulesExistenceUseCase` on `.agents/.ai/rules`; IDs without rules are reported to the user. |
| Guide for creating missing rules | ✅ | `make_rule.md` is populated with a guide to create rules. |
| Rules format (YAML) | ✅ | Rules are written in YAML (`.yaml` extension) in `.agents/.ai/rules/{agentId}.yaml`. |
| Message when rules are missing | ✅ | `showWarningMessage` with list of agents without rules and action «Open make_rule.md»; integrated after `fetchAndInstallRules` in `StartSyncOrchestration`. |

**Files:** `FetchAndInstallRulesUseCase.ts`, `GetMissingRulesAgentIdsUseCase.ts`, `GitHubRuleProvider.ts`, `extension.ts` (notification), `StartSyncOrchestration.ts`, `.agents/.ai/rules/make_rule.md`

---

### 3.4 File watchers (Requirement 4)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Watch IDE file changes | ✅ | `IdeWatcherService` watches active IDE source roots (`.cursor`, `.cline`, etc.) via `createFileSystemWatcher`. |
| Watch `.agents` changes | ✅ | `AgentsWatcherService` watches `.agents/[!.]*/` (excludes `.agents/.ai/`) to avoid loops. |
| Update `.agents` when IDE changes | ✅ | IDE watcher triggers `runReactiveInboundSync` → `syncEngine.syncAgent` (IDE → `.agents`). |
| Update `.agents/.ai/state.json` | ✅ | `config.manifest.markAsSynced()` after each reactive sync (inbound and outbound). |
| Only touch affected files | ✅ | Incremental sync: watchers accumulate affected URIs as `affectedPaths`; DefaultSyncInterpreter only processes affected files. |

**Note:** Debounce (400 ms) is used to avoid running sync on every keystroke.

**Files:** `IdeWatcherService.ts`, `AgentsWatcherService.ts`, `extension.ts`, `debounce.ts`

**Roadmap:** See `context/apps/vscode/dev/file-watchers/` for sprints and detailed status.

---

### 3.5 Sync .agents → IDE (Requirement 5)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Apply rules when `.agents` changes | ✅ | `AgentsWatcherService` triggers `runReactiveOutboundSync` → `syncEngine.syncOutboundAgent`. |
| Outbound direction (`.agents` → IDE) | ✅ | `DiffSyncAdapter.syncOutboundAgent()` uses `rule.mappings.outbound` (`.agents` → IDE). |

**Files:** `DiffSyncAdapter.ts`, `AgentsWatcherService.ts`, `extension.ts`

---

### 3.6 Manual sync (Requirement 6)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Trigger sync manually | ✅ | Command `dotagents-vscode.sync`. |
| Choose IDE in dialog | ✅ | Tool selector is always shown first (`selectActiveAgent`). |
| Choose direction (IDE→.agents / .agents→IDE) | ✅ | `showSyncDirectionPicker()` offers IDE→.agents (inbound) and .agents→IDE (outbound). |

**Flow:** tool → direction → sync. **Files:** `extension.ts`, `StartSyncOrchestration.ts`

**Roadmap:** See `context/apps/vscode/dev/sync-manual/` for sprints and detailed status.

---

### 3.7 Menu: change tool (Requirement 7)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Menu option to change tool | ✅ | «Configure Active Agents» opens selector and persists `currentAgent`/`lastActiveAgent`. |
| Sync new after changing tool | ✅ | After `selectActiveAgent`, if rules exist for the tool, bidirectional `syncNew` runs; otherwise guard remains (e.g. status bar «Missing rules»). Order: rules → tool. |
| Current options | ⚠️ | Sync Now, Add Agent/IDE, Configure Active Agents, Generate Rules Prompt (not implemented). |

**Files:** `extension.ts`

---

### 3.8 Ask when opening different IDE (Requirement 8)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Compare current IDE with `manifest.currentAgent` | ✅ | `StartSyncOrchestration` compares `hostAgentId` with `currentAgent` before sync. |
| Ask for tool if they differ | ✅ | If `currentAgent` is null or different from `hostAgentId`, selector opens. |
| Default value | ✅ | Detection fallback is `"vscode"`; `"cursor"` is not assumed. |

**Files:** `StartSyncOrchestration.ts`, `AgentHostDetector.ts`

---

### 3.9 Agent Host Detector (recognised IDEs)

| Aspect | Status | Detail |
| ------ | ------ | ------ |
| Recognised IDEs only with rules | ✅ | `WORKSPACE_KNOWN_AGENTS` includes only agents with rules on GitHub: `antigravity`, `cursor`. |
| Dynamic detection | ✅ | `detectAgentFromHostApp()` iterates over `WORKSPACE_KNOWN_AGENTS`; if no match, returns `"vscode"`. |
| Unrecognised IDE | ✅ | `isHostIdeRecognized()`: true if `appName` includes any agent.id or "vscode"/"visual studio code"; otherwise IDE not supported (Windsurf, Cline, etc.). |
| Unsupported IDE notification | ✅ | `notifyUnrecognizedIde()`: once per session, if IDE not recognised, message with actions "Add Agent" and "Open make_rule.md". |

**Files:** `AgentHostDetector.ts` (detectAgentFromHostApp, isHostIdeRecognized, getHostAppName), `extension.ts` (notifyUnrecognizedIde, setupWatchers)

---

## 4. `state.json` structure

### 4.1 Current location

- **Current:** `.agents/.ai/state.json`
- **Intended:** `.agents/.ai/state.json` (implicit in design)

### 4.2 Current structure

```json
{
  "manifest": {
    "lastProcessedAt": 1771529966626,
    "lastActiveAgent": "cursor",
    "currentAgent": "cursor",
    "agents": {
      "antigravity": { "lastProcessedAt": 0 },
      "cursor": { "lastProcessedAt": 1771529966626 }
    }
  },
  "agents": [
    { "id": "cursor", "name": "cursor", "sourceRoot": ".cursor", "inbound": [], "outbound": [] },
    ...
  ]
}
```

**Applied / planned changes:**

- `manifest.agents` contains only agents with rules on GitHub (`antigravity`, `cursor`). The key `manifest.agents.agents` is redundant and removed (Sprint 5).
- **sourceRoot and paths:** `agents[].sourceRoot` can be derived from the first path with `scope: "workspace"` and `purpose: "marker"` or `"sync_source"` when YAML rules use `paths`; kept for compatibility with consumers that only read `sourceRoot`.

### 4.3 Semantics (current and intended)

| Field | Description |
| ----- | ----------- |
| `manifest.lastProcessedAt` | Global timestamp of last sync. |
| `manifest.lastActiveAgent` | Last tool that synced. |
| `manifest.currentAgent` | Active tool; user is asked when IDE differs or no value is set. |
| `manifest.agents` | `{ agentId: { lastProcessedAt } }` — per-tool timestamps to know which is most up to date. |
| `agents` | Array for the tool selector (`id`, `name`, `sourceRoot`, etc.). May optionally include `paths` (array of objects with path, scope, type, purpose); when present, `sourceRoot` is derived from `paths` for UI and sync. |

---

## 4.5 Behaviour changes (Agent Host Detector)

| # | Change |
|:-:|--------|
| 1 | Detection default is `vscode`, not `cursor`. |
| 2 | Only IDEs with rules on GitHub are recognised (`antigravity`, `cursor`). |
| 3 | If `currentAgent` is null or different from `hostAgentId`, selector opens. |
| 4 | If IDE is not recognised, user is notified with Add Agent / Open make_rule.md options. |
| 5 | Placeholder in selector when IDE is not in the list. |
| 6 | Redundant `manifest.agents.agents` removed (Sprint 5). |
| 7 | **Paths as array:** Migration from single `source_root` / `configPath` / `workspaceMarker` to the `paths` model (array of objects with path, scope, type, purpose). YAML rules and `WORKSPACE_KNOWN_AGENTS` support `paths`; detection (FsAgentScanner), watchers (IdeWatcherService) and sync use paths with purpose marker/sync_source. See `context/project/reports/source_filePath.md` and `context/pkg/rule/doc/rule.md`. |

### 4.6 Behaviour changes (Tool Change Sync and Known Agents from Rules)

| # | Change |
|:-:|--------|
| 1 | **Bidirectional sync new:** When changing tool (selector or Add Agent), `syncNew(workspaceRoot, agentId)` (outbound + inbound) runs if rules exist; otherwise no sync (existing guard). |
| 2 | **Known agents at build:** `WORKSPACE_KNOWN_AGENTS` is generated from `rules/*.yaml` (WorkspaceAgents.generated.ts); only agents with published rules. |
| 3 | **Runtime selector:** Includes agents from `.agents/.ai/rules/*.yaml` (custom) merged with known; Add Agent Manually uses the same dynamic list and "Custom...". |

---

## 5. Main differences

| Requirement | Current | Intended | Gap |
| ----------- | ------- | -------- | --- |
| Tool selector | QuickPick UI + default check | Select list UI with default check | Implemented. |
| Missing rules | User message + Open `make_rule.md` action | User message + populated `make_rule.md` | Implemented. |
| File watchers | IdeWatcherService + AgentsWatcherService | Reactive IDE ↔ `.agents` | Implemented. |
| Bidirectional sync | IDE ↔ `.agents` (inbound + outbound) | IDE ↔ `.agents` | Implemented. |
| Manual sync with options | Tool selector + direction picker | Choose IDE and direction | Implemented. |
| Change tool in menu | Implemented (Configure Active Agents) | Yes | Implemented. |
| Ask when opening different IDE | Implemented | Yes if IDE ≠ currentAgent | Implemented. |

---

## 6. Current technical dependencies

- **@dotagents/diff**: `SyncProjectUseCase`, `InitializeProjectUseCase`, `SyncManifest`, `Configuration`. Integration roadmap: `context/apps/vscode/dev/core-engine-integration/`.
- **@dotagents/rule**: `ClientModule.createListInstalledRulesUseCase` to list rules in `.agents/.ai/rules`.
- **NodeConfigRepository**: `state.json` at `.agents/.ai/state.json`.
- **WORKSPACE_KNOWN_AGENTS**: generated at build from `rules/*.yaml` (only agents with rules in the repo); at runtime the selector merges these with agents from `.agents/.ai/rules/*.yaml` (custom rules). Uses the `paths` model (PathEntry[]) with helpers `getWorkspaceMarker`, `getConfigPath`, `getSyncSourcePaths`; detection and watchers rely on those paths.
- **YAML rules** (`.agents/.ai/rules/*.yaml`): use the `paths` schema when migrated; spec in `context/pkg/rule/doc/rule.md`.
- **FsAgentScanner**: agent detection via `WORKSPACE_KNOWN_AGENTS`.
- **AgentHostDetector**: `detectAgentFromHostApp()` (fallback `"vscode"`), `isHostIdeRecognized()`, `getHostAppName()`.
- **MigrateExistingAgentsToBridgeUseCase**: migration IDE → `.agents` when `.agents` does not exist.
- **IdeWatcherService**: file watcher for active IDE source roots; triggers reactive inbound sync.
- **AgentsWatcherService**: file watcher for `.agents` (excl. `.agents/.ai/`); triggers reactive outbound sync.

---

## 7. Recommendations to close the gap

1. **Step 1:** ~~Implement tool selection dialog~~ (QuickPick implemented).
2. **Step 2:** ~~Add menu option to change tool~~ («Configure Active Agents» implemented).
3. **Step 3:** ~~Before first sync, compare IDE with `manifest.currentAgent`~~ (selector integrated in initial flow).
4. **Step 4:** ~~Show notification when rules are missing~~ (implemented: `notifyMissingRules` in sync flow).
5. **Step 5:** ~~Implement `vscode.workspace.createFileSystemWatcher` for IDE and `.agents`~~ (implemented: `IdeWatcherService`, `AgentsWatcherService`).
6. **Step 6:** ~~Add outbound sync (`.agents` → IDE)~~ (implemented: `syncOutboundAgent` in `DiffSyncAdapter`).
7. **Step 7:** ~~Extend manual sync command with dialog to choose direction (IDE→.agents / .agents→IDE)~~ (implemented: `showSyncDirectionPicker`, order tool→direction→sync).
8. **Step 8:** ~~Implement incremental sync (only affected files)~~ (implemented: `affectedPaths` in `SyncProjectRequestDTO`, `DefaultSyncInterpreter.interpretIncremental`, URI accumulation in watchers).

---

## 8. Code references

| Component | Path |
| --------- | ---- |
| Extension entry | `apps/vscode/src/extension.ts` |
| Sync orchestrator | `apps/vscode/src/modules/orchestrator/app/StartSyncOrchestration.ts` |
| Sync adapter | `apps/vscode/src/modules/orchestrator/infra/DiffSyncAdapter.ts` |
| Agent Host Detector | `apps/vscode/src/modules/orchestrator/infra/AgentHostDetector.ts` |
| IDE watcher | `apps/vscode/src/modules/orchestrator/infra/IdeWatcherService.ts` |
| .agents watcher | `apps/vscode/src/modules/orchestrator/infra/AgentsWatcherService.ts` |
| Config repository | `apps/vscode/src/modules/orchestrator/infra/NodeConfigRepository.ts` |
| Rules | `apps/vscode/src/modules/orchestrator/app/FetchAndInstallRulesUseCase.ts` |
| Agents domain | `apps/vscode/src/modules/orchestrator/domain/WorkspaceAgents.ts` |
| Initialisation | `packages/diff/src/modules/config/app/use-cases/InitializeProjectUseCase.ts` |
| SyncManifest | `packages/diff/src/modules/config/domain/entities/SyncManifest.ts` |
| Migration | `apps/vscode/src/modules/orchestrator/app/MigrateExistingAgentsToBridgeUseCase.ts` |

**Applied roadmaps (status in each `status.md`):**

| Roadmap | Location | Content |
| ------- | -------- | ------- |
| Agent Host Detector | `context/apps/vscode/dev/agent-host-detector/` | Known agents GitHub only; dynamic AgentHostDetector (fallback vscode); unrecognised IDE (notification + Add Agent / make_rule). |
| Tool Change Sync | `context/apps/vscode/dev/tool-change-sync/` | Bidirectional sync new; Add Agent Manual flow (config + syncNew); integration on tool change (onAfterSave → syncNew if rules exist). |
| Known Agents from Rules | `context/apps/vscode/dev/known-agents-from-rules/` | Build: generate WORKSPACE_KNOWN_AGENTS from rules/; runtime: selector with custom rules (.agents/.ai/rules); Add Agent Manually with dynamic list. |
