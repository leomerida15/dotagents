# DotAgents Rule Creation Prompt

Eres un Agente de IA de desarrollo. Estamos configurando un sistema de sincronización universal llamado **DotAgents**.

Necesito que generes un archivo de configuración YAML para ti mismo que defina cómo sincronizar tus reglas, habilidades y flujos de trabajo con el puente universal `.agents/`.

## Instrucciones:
1. Identifica tu ID de agente (ej: `cursor`, `claude-code`, `antigravity`, `cline`, etc.) y tu nombre.
2. Define datos de interfaz gráfica bajo `ui` (icon, color, description).
3. Identifica tus rutas de configuración: en el workspace (carpeta o archivos del proyecto) y, si aplica, en home (config global, relativa a `$HOME`).
4. Genera un archivo YAML usando el esquema con `paths` (ver abajo). Cada entrada en `paths` tiene:
   - **path**: ruta relativa (al workspace o a `$HOME` según `scope`).
   - **scope**: `"workspace"` (raíz del proyecto) o `"home"` (relativo a `$HOME`, sin `~`).
   - **type**: `"file"` o `"directory"`.
   - **purpose**: `"marker"` (detección de agente), `"sync_source"` (origen/destino de sync), `"config"` (configuración global).
5. Define los mapeos `inbound` (de ti hacia `.agents/`) y `outbound` (de `.agents/` hacia ti).
6. Si utilizas extensiones de archivo distintas al estándar Markdown `.md` (ej. `.mdc`), utiliza `source_ext` y `target_ext` en el mapeo `directory` para hacer la conversión automática.

## Esquema base con paths y extensiones

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
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".TU_EXTENSION" # (Opcional) Ej. ".mdc" (debe incluir el punto)
      target_ext: ".md"           # (Opcional) La conversión en inbound hacia el puente
    - from: "skills/"
      to: "skills/"
      format: "directory"
    - from: "workflows/"
      to: "workflows/"
      format: "directory"
  outbound:
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".md"           # (Opcional si usaste target_ext arriba)
      target_ext: ".TU_EXTENSION" # (Opcional si usaste source_ext arriba) Ej. ".mdc"
    - from: "skills/"
      to: "skills/"
      format: "directory"
    - from: "workflows/"
      to: "workflows/"
      format: "directory"

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

---

Responde UNICAMENTE con el bloque de código YAML. El archivo debe guardarse en `.agents/.ai/rules/TU_ID.yaml`.
