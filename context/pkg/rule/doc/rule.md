# AI Agent Synchronization Meta-Standard (@dotagents/diff)

This document defines the technical protocol for creating synchronization rules. It is designed to be utilized as an **Agent Skill**, enabling AI IDEs and CLI tools to automatically generate and maintain their own mapping rules to integrate with the `.agents` universal bridge.

## 1. Sync Rule Specification (YAML)

Every AI agent must have a configuration file in **YAML** format. This allows any AI Agent to programmatically read, update, or create new mapping rules.

### Rule Schema (`rules/agents/{agent}.yaml`)

```yaml
version: "1.0"
agent:
  id: "agent-unique-id" # e.g., cursor, claudecode, antigravity, cline
  name: "Human Readable Name"
  ui:
    icon: "gear"      # VSCode Codicon ID or emoji
    color: "#3498db"  # Primary color for UI elements
    description: "Brief description for lists and tooltips"

# The relative base path where the agent stores its local settings
source_root: ".agent-folder/" # Use "." if files are at the project root

# Bidirectional Flow Definition
mapping:
  # INBOUND: From Agent to Universal .agents Bridge
  inbound:
    - from: "instructions.txt"
      to: "rules/core.md"
      format: "markdown"
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".mdc"
      target_ext: ".md"
    - from: "custom_skills/"
      to: "skills/"
      format: "directory"
    - from: "config.json"
      to: "mcp/settings.json"
      format: "json"

  # OUTBOUND: From Universal .agents Bridge to Agent
  outbound:
    - from: "rules/core.md"
      to: "instructions.txt"
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".md"
      target_ext: ".mdc"
    - from: "skills/"
      to: "custom_skills/"
    - from: "mcp/settings.json"
      to: "config.json"

# Universal storage folder target
target_standard: ".agents/"
```

### Paths (alternativa a source_root)

En lugar de `source_root`, puedes usar `paths`: un array de objetos que define explícitamente cada ruta, su alcance, tipo y propósito.

| Campo     | Valores                     | Descripción                                                                 |
|-----------|-----------------------------|-----------------------------------------------------------------------------|
| `path`    | string                      | Ruta relativa al workspace o a `$HOME` según `scope`                        |
| `scope`   | `"workspace"` \| `"home"`   | `workspace` = raíz del proyecto; `home` = relativo a `$HOME` (sin prefijo `~`) |
| `type`    | `"file"` \| `"directory"`   | Archivo o carpeta                                                           |
| `purpose` | `"marker"` \| `"sync_source"` \| `"config"` | `marker` = detección; `sync_source` = origen/destino sync; `config` = configuración global |

**Compatibilidad hacia atrás con source_root:**

- Si existe `source_root` y no existe `paths`, se comporta como hoy.
- Si existe `paths`, tiene prioridad; `source_root` se ignora (o se deriva del primer path workspace con purpose `marker` o `sync_source`).
- Durante la migración ambas claves pueden coexistir; el parser usará `paths` si está presente.

**Ejemplo: Cursor** (carpeta única, mismo nombre en workspace y home):

```yaml
paths:
  - path: ".cursor/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"
  - path: ".cursor"
    scope: "home"
    type: "directory"
    purpose: "config"
mapping:
  inbound: []
  outbound: []
target_standard: ".agents/"
```

**Ejemplo: Antigravity** (nombres distintos workspace vs home):

```yaml
paths:
  - path: ".agent/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"
  - path: ".gemini/antigravity"
    scope: "home"
    type: "directory"
    purpose: "config"
mapping:
  inbound: []
  outbound: []
target_standard: ".agents/"
```

**Ejemplo: Claude-code** (estructura real: .claude/ y ~/.claude/):

```yaml
paths:
  - path: ".claude/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"
  - path: ".claude"
    scope: "home"
    type: "directory"
    purpose: "config"
mapping:
  inbound: []
  outbound: []
target_standard: ".agents/"
```

> Para mappings completos, ver el esquema principal en la sección 1.

### Format Conversion (source_ext / target_ext)

When an agent uses a different file extension than the `.agents` standard, each mapping can specify:

- `source_ext` (optional): Extension in the source path (e.g. `.mdc`). Must include the leading dot.
- `target_ext` (optional): Extension in the target path (e.g. `.md`). Both must be specified together or both omitted.

During sync, files matching `source_ext` are written with `target_ext` at the destination.

**Bidirectionality**: Inbound rules describe agent → .agents (e.g. agent's `.mdc` becomes `.md`). Outbound rules describe .agents → agent; the conversion is reversed (e.g. bridge's `.md` becomes `.mdc`). For consistency, if inbound maps `.mdc` → `.md`, outbound must map `.md` → `.mdc`.

## 2. Universal Bridge Structure (.agents)

The `.agents/` directory acts as the **Source of Truth**. To ensure cross-tool compatibility, agents MUST adhere to this internal layout:

- `.agents/rules/`: Master instruction sets and prompts (`.md`).
- `.agents/skills/`: Reusable scripts, tools, and executable skills.
- `.agents/mcp/`: Model Context Protocol configurations.
- `.agents/sync.json`: The synchronization manifest (heartbeat).

## 3. State Management (Atomic Timestamps)

A numeric timestamp system is used in `.agents/sync.json` to manage state, resolve conflicts, and determine the latest version of the configuration.

### `sync.json` Schema

```json
{
  "last_processed_at": 1739294215000,
  "last_active_agent": "cursor",
  "agents": {
    "agents": 1739294215000,
    "cursor": 1739294215000,
    "antigravity": 1739294000000
  }
}
```

### Synchronization Algorithm:

1. **Detection**: When a file in an agent's path (e.g., `.cursorrules`) is modified, the `@dotagents` engine calculates a new high-precision `timestamp`.
2. **Inbound Push**: The modified data is mapped to the `.agents/` bridge using the `inbound` rules.
3. **Heartbeat Update**: The `sync.json` is updated: `agents.{current_agent} = Date.now()` and `agents.agents = agents.{current_agent}`.
4. **Outbound Pull**: When a different tool (e.g., Antigravity) is activated, the engine checks if `agents.agents > agents.antigravity`. If true, it executes the `outbound` mapping from `.agents/` to the tool's local path.

## 4. Agent Skill: Rule Generation Protocol

When an AI Agent is tasked with "adding support for a new tool", it MUST follow these steps:

1. **Locate**: Identify the configuration paths (local project folder and global config folder) of the target tool.
2. **Standardize**: Map those paths to the nearest equivalent in the `.agents/` standard (rules, skills, mcp).
3. **Verify Reversibility**: Ensure the `inbound` transformation can be losslessly reversed via the `outbound` rules.
4. **Generate**: Output the final YAML configuration following the schema in Section 1.
