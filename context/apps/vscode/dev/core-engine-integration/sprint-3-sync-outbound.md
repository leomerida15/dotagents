# Sprint 3: Sync outbound

## Context
El Requisito 5 exige que cuando se modifique algo en `.agents`, se apliquen las reglas para llevar los cambios del puente a la herramienta seleccionada (`.agents` → IDE).

## Dependencies
- **Previous:** Sprint 2 (Adapter inbound) — reutiliza `DiffSyncAdapter` y el motor de sync.
- **Next:** Sprint 4 (Sync incremental) mejora el rendimiento de ambos flujos.

## Pasos a ejecutar
- Implementar `syncOutboundAgent` en `DiffSyncAdapter`.
- Usar `rule.mappings.outbound` (`.agents` → IDE) desde el YAML de reglas.
- Conectar con el orquestador para que el watcher de `.agents` dispare sync outbound al detectar cambios.
- Actualizar `manifest` tras el sync outbound.

## Status
- [x] `DiffSyncAdapter.syncOutboundAgent()` implementado.
- [x] Mappings outbound desde YAML aplicados.
- [x] Watcher `.agents` dispara sync outbound reactivo.
- [x] `state.json` actualizado tras sync outbound.
