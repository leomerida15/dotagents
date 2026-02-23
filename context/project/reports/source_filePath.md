# source_root → paths: decisiones

Las dudas iniciales sobre `source_root` y `configPath` quedaron cerradas con la adopción del esquema `paths`. Resumen y referencias a continuación.

## Contexto

- **YAML (reglas)**: define `source_root` (ej. `.cursor/`, `.agent/`) como ruta base donde el agente almacena su configuración.
- **Código (`WorkspaceAgents.ts`)**: define `KnownAgent` con `configPath` y `workspaceMarker`:
  - `workspaceMarker`: carpeta en la raíz del workspace para detectar el agente (ej. `.cursor`, `.agent`).
  - `configPath`: ruta bajo HOME para buscar config instalada (ej. `~/.cursor`, `~/.gemini/antigravity`).

## Esquema paths (definición)

Se adopta un array `paths` de objetos con la siguiente estructura:

```yaml
paths:
  - path: string       # relativo a workspace o HOME según scope
  - scope: "workspace" | "home"
  - type: "file" | "directory"
  - purpose: "marker" | "sync_source" | "config"
```

- **scope**: `workspace` = ruta en raíz del proyecto; `home` = ruta relativa a `$HOME` (sin prefijo `~`)
- **purpose**: `marker` = detección del agente; `sync_source` = origen/destino de sincronización; `config` = configuración global

## Dudas cerradas (decisiones)

### 1. Modelo actual: valores únicos vs. array

**Decisión:** Usar array `paths` con `type` y `purpose` explícitos. `configPath` y `workspaceMarker` se derivan de las entradas con `purpose: "config"` y `purpose: "marker"` respectivamente.

### 2. Mapeo YAML → KnownAgent

**Decisión:** El YAML incluye paths con `scope: "workspace"` y `scope: "home"` explícitos. No hay mapeo implícito por `agent.id`; la regla define ambos valores en `paths`.

### 3. Caso: archivos sueltos en raíz

**Decisión:** Se usa el esquema `paths` con `type: "file"` o `type: "directory"` por entrada. Para agentes con estructura real de carpetas (claude-code: `.claude/`, opencode: `.agents/`), se modelan como directorios.

### 4. Fuente de verdad

**Decisión:** Sí. El esquema YAML incluye explícitamente todos los paths necesarios (workspace, home, archivos y carpetas) para evitar lógica especial en código.

## Referencias

- **Esquema y ejemplos completos:** [context/pkg/rule/doc/rule.md](context/pkg/rule/doc/rule.md)
- **Roadmap source-filepath:** [context/apps/vscode/dev/source-filepath/status.md](context/apps/vscode/dev/source-filepath/status.md)
