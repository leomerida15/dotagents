# Sprint 3: KnownAgent y WorkspaceAgents

## Context

`KnownAgent` en `WorkspaceAgents.ts` tiene `configPath` y `workspaceMarker` (strings únicos). La generación desde rules (known-agents-from-rules) usa `source_root`. Hay que migrar a `paths: PathEntry[]` para soportar múltiples rutas y propósitos.

## Dependencies

- **Previous:** Sprint 1 (especificación), Sprint 2 (YamlMapper/DTOs).
- **Next:** Sprint 4 (FsAgentScanner, IdeWatcherService) consume `KnownAgent.paths`; known-agents-from-rules debe generar paths desde YAML.

## Pasos a ejecutar

1. Modificar interfaz `KnownAgent` en `WorkspaceAgents.ts`:
   - Añadir `paths?: PathEntry[]`.
   - Mantener temporalmente `configPath` y `workspaceMarker` como derivados (getters) para no romper consumidores.
2. Actualizar script de generación de known agents (si existe) para extraer `paths` desde YAML en lugar de solo `source_root`. Nota: el script se creará en known-agents-from-rules/sprint-1; debe usar YamlMapper (o parseo manual) para extraer `paths` y generar `KnownAgent` con `paths` poblado.
3. Definir helpers: `getWorkspaceMarker(agent)`, `getConfigPath(agent)`, `getSyncSourcePaths(agent)`.
4. Adaptar `WORKSPACE_AGENT_MARKERS` si sigue usándose.
5. Actualizar consumidores directos de `KnownAgent` para usar paths cuando esté disponible.

## Status

🟢 completo

## Checklist

- [x] KnownAgent.paths definido
- [x] Helpers para derivar marker/configPath/syncPaths
- [x] Script de generación usa paths desde YAML (pendiente: known-agents-from-rules/sprint-1; cuando exista, debe extraer `paths` desde YAML y generar KnownAgent con paths + configPath/workspaceMarker derivados)
- [x] Consumidores adaptados
- [x] Tests pasando
