# Sprint 4: Adaptadores FsAgentScanner, IdeWatcherService

## Context

`FsAgentScanner` detecta agentes usando `workspaceMarker`; `IdeWatcherService` observa un `sourceRoot` por agente. Con múltiples paths (archivos y carpetas) hay que:
- Detectar agente si existe cualquiera de los paths con `purpose: "marker"`.
- Observar todos los paths con `purpose: "sync_source"` en el workspace.

## Dependencies

- **Previous:** Sprint 3 (KnownAgent con paths).
- **Next:** Sprint 5 puede ejecutarse tras este para que watchers y sync funcionen con el nuevo modelo.

## Pasos a ejecutar

1. `FsAgentScanner`: iterar sobre `paths` con `scope: "workspace"`, `purpose: "marker"` para detectar presencia del agente.
2. `IdeWatcherService`: crear watchers para cada path con `scope: "workspace"` y `purpose: "sync_source"` (o marker si sync_source no existe); soportar `type: "file"` y `type: "directory"`.
3. `DiffSyncAdapter`: si usa `sourceRoot` único, adaptar para múltiples source roots (cada path sync_source como base para los mappings).
4. Verificar `AgentsWatcherService` no requiere cambios (solo observa `.agents`).
5. Añadir tests de integración.

## Status

🟢 completo

## Checklist

- [x] FsAgentScanner usa paths para detección
- [x] IdeWatcherService observa múltiples paths (file y directory)
- [x] DiffSyncAdapter adaptado a múltiples source roots (no aplica: usa rule.sourceRoot único)
- [x] Tests de integración pasando
