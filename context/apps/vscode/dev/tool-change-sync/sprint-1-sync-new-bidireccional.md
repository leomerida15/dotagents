# Sprint 1: Sync new bidireccional

## Context

Cuando el usuario cambia de herramienta (o agrega una nueva) y existen reglas locales para esa herramienta, debe ejecutarse un "sync new" bidireccional:
1. **Outbound** (.agents → IDE): llevar el contenido del puente al directorio del IDE.
2. **Inbound** (IDE → .agents): llevar el contenido del IDE al puente.

Esto garantiza que el nuevo IDE tenga los datos del puente y que el puente refleje el estado inicial del IDE. El sync debe ejecutarse sin `affectedPaths` (full sync) para ambos sentidos.

## Dependencis

- **Previous:** Ninguno (sync inbound y outbound ya existen en `DiffSyncAdapter`).
- **Next:** Sprint 2 (Add Agent Manual flow) y Sprint 3 (Integración) usarán esta operación.

## Pasos a ejecutar

1. Añadir método o flujo `syncNew(workspaceRoot: string, agentId: string)` que ejecute:
   - `syncEngine.syncOutboundAgent(workspaceRoot, agentId)` (sin affectedPaths)
   - `syncEngine.syncAgent(workspaceRoot, agentId)` (sin affectedPaths, inbound)
2. Integrar con `IgnoredPathsRegistry` si es necesario (evitar que watchers disparen sync tras cada escritura).
3. Asegurar que solo se ejecute si existen reglas para el agente (guard existente en `StartSyncOrchestration`).
4. Documentar el orden: outbound primero, luego inbound.

## Status

🟢 completo

## Checklist

- [x] Definir `syncNew` o equivalente (outbound + inbound secuencial)
- [x] Integrar con IgnoredPathsRegistry/cooldown para evitar bucles
- [x] Verificar que el guard de reglas faltantes siga aplicando
- [x] Probar manualmente cambio cursor ↔ antigravity
