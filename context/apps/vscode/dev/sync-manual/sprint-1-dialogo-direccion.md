# Sprint 1: Diálogo de dirección

## Context
El Requisito 6 exige poder elegir la dirección del sync manual: IDE → .agents (inbound) o .agents → IDE (outbound). Actualmente el comando siempre ejecuta inbound.

## Dependencies
- **Previous:** None
- **Next:** Sprint 2 (Integración) depende de que este sprint entregue la UI.

## Pasos a ejecutar
- Crear función helper (ej. `showSyncDirectionPicker()`) que muestre un QuickPick con dos opciones: "IDE → .agents" (inbound) y ".agents → IDE" (outbound).
- Retornar `'inbound' | 'outbound' | null` según la elección del usuario (null si cancela).
- Ubicación sugerida: `extension.ts` o módulo UI dedicado; reutilizable por el comando sync.

## Status
- [x] Función `showSyncDirectionPicker()` creada.
- [x] QuickPick muestra labels claros para ambas direcciones.
- [x] Retorna correctamente inbound/outbound/null.
