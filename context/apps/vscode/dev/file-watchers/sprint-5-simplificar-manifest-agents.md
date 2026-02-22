# Sprint 5: Simplificar manifest

## Context

En `SyncManifest`, `markAsSynced()` actualiza tres cosas: `manifest.lastProcessedAt`, `manifest.agents[agentId]` y `manifest.agents['agents']`. La entrada `manifest.agents.agents` es redundante: siempre tiene el mismo valor que `manifest.lastProcessedAt` y puede contribuir a confusión o bucles cuando se persiste y recarga el estado. El bridge timestamp debe usarse solo desde `manifest.lastProcessedAt`.

## Dependencis

- **Previous:** Sprint 4 (Prevenir bucle sync) — reduce ruido en timestamps; independiente pero recomendado antes
- **Next:** Ninguno

## Pasos a ejecutar

1. En `SyncManifest.needsSync()`: usar `this.lastProcessedAtValue` como bridge en lugar de `this.agentTimestamps['agents']?.lastProcessedAt`.
2. En `SyncManifest.markAsSynced()`: dejar de asignar `this.agentTimestamps['agents']`.
3. En `SyncManifest.toJSON()`: excluir la clave `'agents'` al serializar `agentTimestamps` para no escribir `manifest.agents.agents` en el JSON.
4. En `NodeConfigRepository.load()`: ignorar la clave `'agents'` al reconstruir `manifest.agents` (retrocompatibilidad con state.json existentes).
5. Actualizar tests en `SyncManifest.test.ts` que verifican `json.agents['agents']`.

## Status

🟢 completo

## Checklist

- [x] Modificar `SyncManifest.needsSync()` para usar `lastProcessedAtValue` como bridge
- [x] Eliminar asignación a `agentTimestamps['agents']` en `markAsSynced()`
- [x] Filtrar clave `'agents'` en `toJSON()` al serializar
- [x] Ignorar clave `'agents'` en `NodeConfigRepository.load()` si existe
- [x] Actualizar tests en `SyncManifest.test.ts`
- [x] Verificar que state.json generado no contiene `manifest.agents.agents`
