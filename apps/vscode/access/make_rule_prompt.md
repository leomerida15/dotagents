# DotAgents Rule Creation Prompt

Eres un Agente de IA de desarrollo. Estamos configurando un sistema de sincronización universal llamado **DotAgents**.

Necesito que generes un archivo de configuración YAML para ti mismo que defina cómo sincronizar tus reglas, habilidades, comandos y flujos de trabajo con el puente universal `.agents/`.

## Paso 1 — Declara qué funciones soporta tu herramienta

Antes de generar el YAML, identifica cuáles de las siguientes **categorías de configuración** soporta tu herramienta. Solo incluirás mapeos para las que realmente existan en tu agente.

| Categoría | Descripción | Ruta canónica en `.agents/` | ¿Crea reglas? |
|---|---|---|---|
| **rules** | Instrucciones persistentes que guían el comportamiento del agente (system prompts, project rules, coding standards). Se aplican siempre o por trigger/glob. | `.agents/rules/` | ✅ Sí — es la unidad principal de sincronización |
| **skills** | Capacidades especializadas activables bajo demanda. Cada skill es una carpeta con un `SKILL.md` que define un workflow completo que el agente ejecuta cuando el usuario lo solicita. | `.agents/skills/` | ❌ No — son capacidades, no restricciones de comportamiento |
| **workflows** | Comandos o acciones reutilizables que el usuario invoca explícitamente (slash commands, task runners, prompts parametrizados). | `.agents/workflows/` | ❌ No — son disparadores de acción, no reglas |
| **agents** | Definición de agentes subordinados con personalidad, permisos y alcance propios (sub-agents, custom agent modes). | `.agents/agents/` | ❌ No — son orquestación, no reglas |
| **agent-file** | Archivo único de instrucciones en la raíz del proyecto (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.clinerules`, etc.). | `.agents/rules/<id>-agent.md` | ✅ Sí — equivale a una regla global del proyecto |
| **mcp** | Configuración de servidores MCP (Model Context Protocol): `mcp.json`, `.mcp.json`, sección en settings. | `.agents/mcp/` | ❌ No (es config de herramientas externas) |
| **docs** | Documentación de contexto que el agente usa como referencia (no son instrucciones de comportamiento). | `.agents/docs/` | ❌ No (es contexto, no comportamiento) |
| **custom** | Cualquier otra forma de configuración propia de la herramienta que deba ser portada al puente (ej. snippets, templates, personas). | `.agents/<categoria>/` | Depende del contenido |

---

### Cómo distinguir rules, skills y workflows

Estas tres categorías son las que más se prestan a confusión. Usa esta guía para clasificar correctamente:

| | **Rules** | **Skills** | **Workflows** |
|---|---|---|---|
| **Propósito** | Guiar/restringir el comportamiento general del agente | Dar una competencia especializada activable bajo demanda | Definir una acción invocable que el usuario dispara |
| **Activación** | Siempre activa, o por trigger/glob automático | Cuando el usuario pide algo que encaja con la `description` del skill | Cuando el usuario invoca un comando explícito (ej. `/planning`) |
| **Persistencia** | Permanente durante la sesión | Solo mientras se ejecuta el skill | Solo durante la ejecución del comando |
| **Contiene** | Restricciones, estándares, convenciones | Workflow completo: cuándo usar, reglas internas, pasos, formato de salida | Prompt parametrizado o secuencia de pasos |
| **Formato típico** | `.mdc`, `.md` con frontmatter (`alwaysApply`, `globs`) | Carpeta con `SKILL.md` (frontmatter `name`, `description`) | `.md` con frontmatter (`description`, opcionalmente `trigger`) |
| **Ejemplo** | "Usa Bun en vez de Node" | "Escribe tests TDD antes de implementar" | `/planning` — genera un plan basado en un sprint |
| **Ruta en `.agents/`** | `rules/` | `skills/<nombre>/SKILL.md` | `workflows/` |

> **Regla de oro:** Se sincronizan como **reglas** aquellos archivos cuyo propósito es instruir/restringir/guiar el comportamiento del agente de IA en todo momento o bajo un patrón automático. Si el archivo define una **capacidad invocable** con su propio workflow, es un **skill**. Si define un **comando o acción** que el usuario dispara explícitamente, es un **workflow**.

**Tests rápidos para clasificar:**

1. ¿Se aplica automáticamente sin que el usuario lo pida? → **Rule**
2. ¿El agente lo activa cuando detecta que la tarea encaja? → **Skill**
3. ¿El usuario lo invoca con un comando explícito (ej. `/comando`)? → **Workflow**
4. ¿Configura una herramienta externa (MCP, linter, etc.)? → **Ni rule ni skill ni workflow** (es `mcp` o `config`)

---

## Paso 2 — Instrucciones para generar el YAML

1. Identifica tu ID de agente (ej: `cursor`, `claude-code`, `antigravity`, `cline`, etc.) y tu nombre.
2. Define datos de interfaz gráfica bajo `ui` (icon, color, description).
3. Identifica tus rutas de configuración: en el workspace (carpeta o archivos del proyecto) y, si aplica, en home (config global, relativa a `$HOME`).
4. Genera un archivo YAML usando el esquema con `paths` (ver abajo). Cada entrada en `paths` tiene:
   - **path**: ruta relativa (al workspace o a `$HOME` según `scope`).
   - **scope**: `"workspace"` (raíz del proyecto) o `"home"` (relativo a `$HOME`, sin `~`).
   - **type**: `"file"` o `"directory"`.
   - **purpose**: `"marker"` (detección de agente), `"sync_source"` (origen/destino de sync), `"config"` (configuración global).
5. Define los mapeos `inbound` (de ti hacia `.agents/`) y `outbound` (de `.agents/` hacia ti). **Incluye únicamente las categorías que tu herramienta soporta** según el Paso 1.
6. Si utilizas extensiones de archivo distintas al estándar Markdown `.md` (ej. `.mdc`), utiliza `source_ext` y `target_ext` en el mapeo `directory` para hacer la conversión automática.
7. Si necesitas extraer datos específicos de un JSON (ej. claves de configuración), usa `extract` (JSONPath) y `format: json-transform` o `json-split`.
8. Si tu agente guarda reglas en `.md` pero el estándar o otra herramienta espera JSON, usa conversión de contenido: `format: md-json` (inbound) y `format: json-md` (outbound), con el esquema estándar `{ "content": "<markdown>", "description": "opcional" }` (ver documentación en `context/pkg/rule/doc/rule.md`).
9. Si tu herramienta usa un **archivo único de instrucciones** en la raíz (`AGENTS.md`, `CLAUDE.md`, etc.), mapearlo como un `file` con `format: "file"` hacia `.agents/rules/<id>-agent.md`.
10. Mapea los **commands/slash commands** de tu herramienta hacia `workflows/` en el puente. El nombre del comando nativo puede diferir (ej. Cursor usa `commands/`, Claude Code podría usar `tasks/`).
11. Si tu herramienta soporta **sub-agents** o **custom agent modes**, mapéalos hacia `agents/` en el puente.

## Esquema base con paths, extensiones y transformaciones

```yaml
version: "1.0"
agent:
  id: "TU_ID"
  name: "TU_NOMBRE"
  ui:
    icon: "gear"      # Codicon ID de VSCode o emoji
    color: "#3498db"  # Color principal hexadecimal
    description: "Breve descripción para listas y tooltips"

paths:
  - path: "TU_RUTA_WORKSPACE"   # ej. ".cursor/" o "rules.md"
    scope: "workspace"
    type: "directory"            # o "file" si son archivos sueltos
    purpose: "marker"            # o "sync_source"
  - path: "TU_RUTA_HOME"        # ej. ".cursor" o ".gemini/antigravity"
    scope: "home"
    type: "directory"
    purpose: "config"

mapping:
  inbound:
    # [rules] ✅ Instrucciones persistentes → se sincronizan como reglas
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".TU_EXTENSION" # (Opcional) Ej. ".mdc" (debe incluir el punto)
      target_ext: ".md"           # (Opcional) La conversión en inbound hacia el puente

    # [agent-file] ✅ Archivo único de instrucciones en raíz → regla global
    # Descomenta si tu herramienta usa un archivo como AGENTS.md, CLAUDE.md, GEMINI.md, etc.
    # - from: "AGENTS.md"
    #   to: "rules/TU_ID-agent.md"
    #   format: "file"

    # [skills] Capacidades especializadas (carpetas con SKILL.md)
    - from: "skills/"
      to: "skills/"
      format: "directory"

    # [workflows] Comandos invocables por el usuario (slash commands, task prompts)
    - from: "TU_CARPETA_COMMANDS/"  # ej. "commands/" en Cursor, "tasks/" en otros
      to: "workflows/"
      format: "directory"

    # [agents] Definiciones de sub-agentes o modos de agente personalizados
    # Descomenta si tu herramienta soporta sub-agents
    # - from: "agents/"
    #   to: "agents/"
    #   format: "directory"

    # [mcp] ❌ Config de herramientas externas, no reglas
    # Descomenta si tu herramienta tiene configuración MCP separada
    # - from: "mcp.json"
    #   to: "mcp/TU_ID-mcp.json"
    #   format: "json-transform"
    #   extract: "$.mcpServers"

    # [docs] ❌ Contexto de referencia, no reglas
    # - from: "docs/"
    #   to: "docs/"
    #   format: "directory"

    # Ejemplo avanzado con JSON
    # - from: "config.json"
    #   to: "config-subset.json"
    #   format: "json-transform"
    #   extract: "$.key.subkey"     # JSONPath opcional
    #   adapter: "agent-mdc"        # Adaptador opcional

  outbound:
    # [rules] ✅
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".md"           # (Opcional si usaste target_ext arriba)
      target_ext: ".TU_EXTENSION" # (Opcional si usaste source_ext arriba) Ej. ".mdc"

    # [agent-file] ✅
    # - from: "rules/TU_ID-agent.md"
    #   to: "AGENTS.md"
    #   format: "file"

    # [skills]
    - from: "skills/"
      to: "skills/"
      format: "directory"

    # [workflows]
    - from: "workflows/"
      to: "TU_CARPETA_COMMANDS/"  # ej. "commands/" en Cursor
      format: "directory"

    # [agents]
    # - from: "agents/"
    #   to: "agents/"
    #   format: "directory"

target_standard: ".agents/"
```

## Ejemplos por tipo de agente

### 1. Carpeta única (mismo nombre en workspace y home)

Ejemplo: Cursor (`.cursor/` en proyecto, `.cursor` en home). *(No olvides el bloque agent y mapping completos)*

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
```

### 2. Paths distintos (nombres diferentes en workspace vs home)

Ejemplo: Antigravity (`.agent/` en proyecto, `.gemini/antigravity` en home).

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
```

### 3. Archivos sueltos en la raíz del proyecto

Ejemplo: agente que usa archivos en la raíz (ej. `rules.md`, `prompts.md`) en lugar de una carpeta.

```yaml
paths:
  - path: "rules.md"
    scope: "workspace"
    type: "file"
    purpose: "marker"
  - path: "prompts.md"
    scope: "workspace"
    type: "file"
    purpose: "sync_source"
  - path: ".miagente"
    scope: "home"
    type: "directory"
    purpose: "config"
```

### 4. Archivo único de instrucciones en raíz (agent-file)

Ejemplo: Claude Code (`CLAUDE.md`), OpenCode (`AGENTS.md`), Gemini (`GEMINI.md`), Cline (`.clinerules`).
Este patrón **crea una regla** en `.agents/rules/<id>-agent.md`.

```yaml
paths:
  - path: "CLAUDE.md"
    scope: "workspace"
    type: "file"
    purpose: "marker"

mapping:
  inbound:
    - from: "CLAUDE.md"
      to: "rules/claude-agent.md"
      format: "file"
  outbound:
    - from: "rules/claude-agent.md"
      to: "CLAUDE.md"
      format: "file"
```

### 5. Commands / Slash commands (workflows)

Ejemplo: Cursor usa `.cursor/commands/` para slash commands; estos se sincronizan como `workflows/` en el puente.

```yaml
mapping:
  inbound:
    - from: "commands/"
      to: "workflows/"
      format: "directory"
  outbound:
    - from: "workflows/"
      to: "commands/"
      format: "directory"
```

Cada archivo en `commands/` es un `.md` con frontmatter (`description`) que define un prompt reutilizable.
Al sincronizar hacia el puente se copian tal cual a `.agents/workflows/`.
Otra herramienta que soporte workflows puede leerlos y adaptarlos a su formato nativo de comandos.

### 6. Skills (capacidades especializadas)

Ejemplo: Cursor usa `.cursor/skills/<nombre>/SKILL.md`; se sincronizan como `skills/` en el puente.

```yaml
mapping:
  inbound:
    - from: "skills/"
      to: "skills/"
      format: "directory"
  outbound:
    - from: "skills/"
      to: "skills/"
      format: "directory"
```

Cada skill es una **carpeta** con al menos un `SKILL.md` que contiene:
- Frontmatter con `name` y `description` (para activación automática).
- Workflow completo: cuándo usar, reglas internas, pasos, formato de salida.

A diferencia de una **rule**, un skill no se aplica automáticamente: el agente lo activa cuando la tarea del usuario encaja con su `description`.

### 7. Sub-agents / Custom agent modes (agents)

Ejemplo: Cursor soporta `.cursor/agents/` para definir modos de agente personalizados.

```yaml
mapping:
  inbound:
    - from: "agents/"
      to: "agents/"
      format: "directory"
  outbound:
    - from: "agents/"
      to: "agents/"
      format: "directory"
```

Cada sub-agent define una **personalidad diferenciada** con su propio alcance, permisos y restricciones.
A diferencia de un workflow (que es una acción puntual), un sub-agent mantiene su contexto durante toda la sesión.

### 8. Configuración MCP (mcp)

Ejemplo: extraer configuración de servidores MCP de un JSON. Este patrón **NO crea reglas**, solo porta configuración de herramientas.

```yaml
mapping:
  inbound:
    - from: "mcp.json"
      to: "mcp/TU_ID-mcp.json"
      format: "json-transform"
      extract: "$.mcpServers"
```

### 9. Transformación JSON avanzada (custom)

Ejemplo: extraer configuración específica de un JSON arbitrario.

```yaml
mapping:
  inbound:
    - from: "config.json"
      to: "config-subset.json"
      format: "json-transform"
      extract: "$.key.subkey"
```

---

Responde con dos secciones:

1. **Tabla de capacidades soportadas**: lista las categorías del Paso 1 que soporta tu herramienta, indicando la ruta nativa y si crea reglas (✅/❌/⚠️).
2. **Bloque YAML**: el archivo de configuración completo. El archivo debe guardarse en `.agents/rules/TU_ID.yaml`.
