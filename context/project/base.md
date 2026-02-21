# Base y concepto del proyecto DotAgents

## Objetivo

Herramienta para **pasar entre un IDE, extensiones para VSCode y TUIs con agentes de IA**. Lo hace **sincronizando los archivos del directorio de configuración** de cada entorno: esa carpeta es la que define el contexto del agente en ese IDE.

## Flujo de sincronización

**.origen → `.agents/` (puente) → .destino**

Ejemplo: `.cursor/` → `.agents/` → `.agent/` para ir de Cursor a Antigravity.  
El motor de sincronización de archivos es el paquete **diff** (`packages/diff`).

## Herramientas con las que partimos

- **IDEs:** cursor, antigravity, vscode  
- **Extensiones:** kilocode, cline  
- **TUIs:** opencode, claudecode  

## Cómo lo hacemos

Cada herramienta usa un **directorio de configuración** con un conjunto de carpetas y archivos. DotAgents usa `.agents/` como **formato intermedio único** (puente universal); no se crean subcarpetas por agente dentro de `.agents/`.

Listado de agentes (Project Path / Global Path) extraído de [vercel-labs/skills](https://github.com/vercel-labs/skills): ver tabla en [README.md](../../README.md) del repo.

## Partes del proyecto

1. **Monorepo** de Bun.js administrado con bunstart.  
2. **`./context`** — persistencia de contexto local del proyecto durante el desarrollo.  
3. **`.agents/`** — estándar **Puente Universal** para sincronización entre agentes de IA (formato canónico: `rules/`, `skills/`, `mcp/`, etc.).  
4. **Arquitectura hexagonal** (puertos y adaptadores).  
5. **Package `diff`** — core del motor de sincronización de directorios.  
6. **Dos apps:** extensión para VSCode y CLI.  

## Referencia

- Regla Cursor del proyecto: `.cursor/rules/base.mdc`  
- README del repo: raíz del monorepo  
