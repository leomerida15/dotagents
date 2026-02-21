# Sprint 3: Integracion en StartSyncOrchestration

## Context
La notificacion debe ejecutarse en el flujo de sincronizacion, justo despues de FetchAndInstallRules, para informar al usuario de reglas faltantes antes de continuar con el sync.

## Dependencis
- Previous: Sprint 2 (Notificacion UI)
- Next: Done

## Pasos a ejecutar
- Integrar la deteccion y notificacion en `StartSyncOrchestration` tras `fetchAndInstallRules.execute()`.
- Verificar que no bloquee el flujo si hay errores en la notificacion.
- Actualizar tests del orquestador si aplica.

## Status
- [x] Notificacion integrada en el flujo inicial.
- [x] Flujo resiliente ante fallos de notificacion.
