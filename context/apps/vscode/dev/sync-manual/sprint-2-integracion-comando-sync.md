# Sprint 2: Integración en comando sync

## Context
Conectar el diálogo de dirección al flujo del comando `dotagents-vscode.sync` y ejecutar la sincronización según la elección del usuario.

## Dependencies
- **Previous:** Sprint 1 (Diálogo de dirección).
- **Next:** Sprint 3 puede ejecutarse tras este; el flujo manual estará funcional.

## Pasos a ejecutar
- Modificar el flujo del sync manual para invocar `showSyncDirectionPicker()` antes de ejecutar sync.
- Si el usuario elige inbound → `syncEngine.syncAgent(workspaceRoot, agentId)`.
- Si el usuario elige outbound → `syncEngine.syncOutboundAgent(workspaceRoot, agentId)`.
- Alternativas de integración: dentro de `StartSyncOrchestration.execute()` o en el handler del comando en `extension.ts` (pasando la dirección al orquestador).

## Status
- [x] Diálogo de dirección integrado en el flujo de sync manual.
- [x] Sync inbound se ejecuta correctamente cuando el usuario elige IDE→.agents.
- [x] Sync outbound se ejecuta correctamente cuando el usuario elige .agents→IDE.
