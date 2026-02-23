# Sprint 1: Build — generar WORKSPACE_KNOWN_AGENTS desde rules/

## Context

El roadmap **source-filepath** está completo: `KnownAgent` tiene `paths?: PathEntry[]` y los helpers `getWorkspaceMarker`, `getConfigPath`, `getSyncSourcePaths`; las reglas YAML usan el esquema `paths` (scope, type, purpose). `WORKSPACE_KNOWN_AGENTS` en `WorkspaceAgents.ts` sigue hardcodeado. La fuente de verdad son los archivos `rules/*.yaml` en el repo. El build debe escanear `rules/`, extraer `agent.id` y `paths` (o `source_root` como fallback), y generar un artefacto con `KnownAgent[]` para que añadir una regla nueva implique automáticamente un agente conocido.

## Dependencis

- **Previous:** Roadmap source-filepath (completo) — modelo `paths`, YamlMapper y KnownAgent ya existen.
- **Next:** Sprint 2 (runtime custom rules) y Sprint 3 (AddAgentManually) usan esta lista como base.

## Pasos a ejecutar

1. Crear script de build (p. ej. en raíz del repo o en `apps/vscode/scripts/`) que:
   - Lea todos los `rules/*.yaml`.
   - Parsee `agent.id` y `paths` (usar lógica compatible con `@dotagents/rule` o parseo mínimo); si no hay `paths`, derivar desde `source_root` a un único `PathEntry` por scope.
   - Genere `WorkspaceAgents.generated.ts` (o JSON importable) con `KnownAgent[]` incluyendo `paths` y, si hace falta, `configPath`/`workspaceMarker` derivados para compatibilidad.
2. Modificar `WorkspaceAgents.ts` para importar `WORKSPACE_KNOWN_AGENTS` desde el artefacto generado; mantener la interfaz `KnownAgent` y los helpers en este archivo.
3. Integrar la ejecución del script en el build de la extensión (pre-step antes de `bun build` en `apps/vscode`).
4. Verificar que FsAgentScanner, AgentHostDetector y demás consumidores siguen funcionando con la lista generada.

## Status

🟢 completo

## Checklist

- [x] Script que escanea rules/*.yaml y extrae agent.id y paths (o source_root)
- [x] Generar artefacto TS con KnownAgent[] (paths + configPath/workspaceMarker si aplica)
- [x] WorkspaceAgents.ts importa WORKSPACE_KNOWN_AGENTS desde artefacto generado
- [x] Script ejecutado en build de vscode (pre-step)
- [x] Tests pasando
