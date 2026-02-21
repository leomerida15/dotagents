# Sprint 4: Sync incremental y manifest

## Context
Para no re-sincronizar todo en cada cambio, el sync debe procesar solo los archivos afectados. Además, tras cada sync (inbound u outbound) se debe actualizar `manifest.lastProcessedAt` y `manifest.agents[agentId].lastProcessedAt` en `state.json`.

## Dependencies
- **Previous:** Sprint 2 (Inbound), Sprint 3 (Outbound) — ambos flujos deben soportar `affectedPaths`.
- **Next:** Done. Los watchers (file-watchers) consumen esta capacidad.

## Pasos a ejecutar
- Pasar lista de archivos afectados (`affectedPaths`) al `SyncProjectRequestDTO` / `SynchronizeAgentRequestDTO`.
- Usar `DefaultSyncInterpreter.interpretIncremental` (o equivalente) para procesar solo archivos afectados.
- Acumular URIs afectadas en los watchers y pasarlas al sync.
- Actualizar `config.manifest.markAsSynced()` tras cada sync reactivo (inbound y outbound).

## Status
- [x] `affectedPaths` soportado en request DTOs.
- [x] Sync incremental procesa solo archivos afectados.
- [x] `markAsSynced()` actualiza `state.json` tras cada sync.
- [x] Watchers pasan URIs afectadas al sync engine.
