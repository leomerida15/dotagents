# AI Agent Synchronization Meta-Standard (@dotagents/diff)

This document defines the technical protocol for creating synchronization rules. It is designed to be utilized as an **Agent Skill**, enabling AI IDEs and CLI tools to automatically generate and maintain their own mapping rules to integrate with the `.agents` universal bridge.

Our sync engine now natively supports **Sub-agent migrations** across different platforms, handling both directory-based Sub-agents (like Cursor via `.md` files) and configuration-based Sub-agents (like OpenCode via JSON splitting and merging).

## 1. Sync Rule Specification (YAML)

Every AI agent must have a configuration file in **YAML** format. This allows any AI Agent to programmatically read, update, or create new mapping rules.

Las reglas de `mapping` pueden mezclar distintos tipos de sincronización en un mismo archivo:

- **Archivos directos** (ej. `instructions.txt -> rules/core.md`)
- **Directorios completos** (`format: directory`)
- **Conversión Markdown ↔ JSON** (`format: md-json` / `json-md`) cuando el agente usa `.md` y el estándar u otra herramienta espera JSON (p. ej. Cursor).
- **Transformaciones JSON** (`format: json`) para convertir estructura/shape entre herramientas

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

### Conversión Markdown ↔ JSON (contenido)

En algunos agentes (por ejemplo **Cursor**) las reglas o sub-agentes se almacenan en archivos **Markdown** (`.md`), mientras que el estándar `.agents` o otra herramienta puede esperar **JSON**. Para interoperar entre ambos, se puede definir una conversión de *contenido* (no solo de extensión):

- **.md → JSON (inbound)**: el contenido del archivo `.md` se escribe en el puente como un objeto JSON con un esquema estándar.
- **JSON → .md (outbound)**: el campo de contenido del JSON se extrae y se escribe como archivo `.md` en el agente.

**Esquema recomendado para el JSON** cuando el origen es Markdown:

```json
{
  "content": "# Título\n\nContenido del archivo markdown...",
  "description": "Descripción opcional para listas o tooltips"
}
```

- `content` (obligatorio): cadena con el contenido Markdown completo.
- `description` (opcional): resumen o etiqueta para UIs que listan reglas/agentes.

**Ejemplo de regla (inbound: directorio de .md → directorio de .json):**

```yaml
mapping:
  inbound:
    - from: "rules/"
      to: "rules/"
      format: "md-json"
      source_ext: ".md"
      target_ext: ".json"
  outbound:
    - from: "rules/"
      to: "rules/"
      format: "json-md"
      source_ext: ".json"
      target_ext: ".md"
```

Si el motor aún no soporta `format: md-json` / `format: json-md`, se puede lograr el mismo efecto con un **adapter** personalizado (registrado en el intérprete) que lea el `.md`, construya `{ "content": "<contenido>" }` y escriba el `.json`, y a la inversa para outbound. La convención del esquema (`content`, `description`) permite que todas las herramientas que implementen esta conversión sean compatibles entre sí.

### JSON Rules (format: json)

When a mapping entry uses `format: json`, the engine treats source and destination as JSON files and preserves valid JSON output during sync.

Use JSON rules when two tools store equivalent configuration in JSON but with different nesting, keys, or file names.

**Example (inbound):**

```yaml
mapping:
  inbound:
    - from: "mcp.json"
      to: "mcp/settings.json"
      format: "json"
```

**Example (outbound):**

```yaml
mapping:
  outbound:
    - from: "mcp/settings.json"
      to: "mcp.json"
      format: "json"
```

Recommendations for JSON mappings:

1. Keep inbound/outbound symmetric whenever possible.
2. Prefer stable key names in `.agents/mcp/` as canonical shape.
3. Validate that generated target is valid JSON after sync.
4. If lossy conversion is required, document it in the rule comments.

### JSON Split (format: json-split)

Splits a single JSON file into multiple files — one per key of a selected object. Useful for inbound rules where a tool stores all sub-agents/configs in a single JSON.

Fields:
- `extract`: JSONPath to the object to split (e.g. `$.agent`)
- `adapter`: name of the registered adapter to transform each value before writing
- `target_ext`: extension of the generated files (default `.json`)

**Example:**

```yaml
mapping:
  inbound:
    - from: "opencode.json"
      to: "agents/"
      format: "json-split"
      extract: "$.agent"
      adapter: "agent-json"
      target_ext: ".json"
```

Result: creates `.agents/agents/architect.json`, `.agents/agents/sdd-orchestrator.json`, etc.

### JSON Merge (format: json-merge)

Inverse of `json-split`. Collects all `.json` files from a source directory, merges them into a single object `{ filename: content }`, and writes the result to a target file. Optionally applies an adapter to wrap the merged object in the tool's expected format.

Fields:
- `from`: source directory containing individual `.json` files
- `to`: destination file path (relative to agent's root)
- `adapter`: name of adapter to wrap/transform the merged object (e.g. `opencode-config`)

**Example:**

```yaml
mapping:
  outbound:
    - from: "agents/"
      to: "opencode.json"
      format: "json-merge"
      adapter: "opencode-config"
```

Result: reads `.agents/agents/*.json`, merges them under `"agent"` key, preserves `$schema` and `mcp` from existing `opencode.json`, and writes the reconstructed file.

**Adapter: `opencode-config`**

Wraps the merged agent map back into the opencode.json format:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": { "<agentName>": { ... } },
  "mcp": { ... }
}
```

If `opencode.json` already exists, the adapter reads and preserves the existing `$schema` and `mcp` sections.

## 2. Universal Bridge Structure (.agents)

The `.agents/` directory acts as the **Source of Truth**. To ensure cross-tool compatibility, agents MUST adhere to this internal layout:

- `.agents/rules/`: Master instruction sets and prompts (`.md`).
- `.agents/agents/`: Sub-agent configurations and prompts (`.md` or `.json`).
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
