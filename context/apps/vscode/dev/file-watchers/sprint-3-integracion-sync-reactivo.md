# Sprint 3: Integracion sync reactivo

## Context
Cuando los watchers detectan cambios, hay que ejecutar el sync correspondiente (IDE -> .agents o .agents -> IDE), actualizar `.agents/.ai/state.json` y solo modificar los archivos afectados.

## Dependencis
- Previous: Sprint 1 (Watcher IDE), Sprint 2 (Watcher .agents)
- Next: Done

## Pasos a ejecutar
- Conectar watcher IDE con sync inbound (IDE -> .agents): llamar a `DiffSyncAdapter.syncAgent` con el agente activo.
- Conectar watcher .agents con sync outbound (.agents -> IDE): aplicar reglas `rule.mappings.outbound` (requiere soporte en `DiffSyncAdapter`).
- Actualizar `manifest.lastProcessedAt` y `manifest.agents[agentId].lastProcessedAt` en `state.json` tras cada sync.
- Implementar logica de “solo archivos afectados”: pasar al sync la lista de archivos cambiados en lugar de re-sincronizar todo.
- Usar debounce para evitar ejecutar sync en cada keystroke.

## Status
- [x] Handler inbound conectado al watcher IDE.
- [x] Handler outbound conectado al watcher .agents.
- [x] Actualizacion de `state.json` tras sync.
- [x] Sync incremental (solo archivos afectados).
- [x] Debounce implementado.
