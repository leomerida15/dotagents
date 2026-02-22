# Sprint 4: Bloquear sync sin reglas

## Context
Si las reglas no existen en GitHub (o falla la descarga), se debe indicar al usuario el prompt de `make_rule.md` para que las cree. No se debe ejecutar sync hasta que las reglas existan localmente. La notificación (`notifyMissingRules`) ya existe; falta bloquear explícitamente el sync.

## Dependencis
- **Previous:** Sprint 3 (guard de reglas locales) establece la verificación antes de sync.
- **Next:** Ninguno; cierra el flujo del item 2.4.

## Pasos a ejecutar
- En `StartSyncOrchestration`, antes del sync: verificar que existe `.agents/.ai/rules/{selectedAgentId}.yaml`.
- Si no existe: llamar `notifyMissingRules` (o equivalente) con el agente faltante y opción de abrir `make_rule.md`.
- Retornar sin ejecutar sync; mostrar mensaje de estado (ej. "Reglas faltantes para {agentId}").
- Asegurar que el flujo reactivo (watchers) tampoco ejecute sync si faltan reglas.

## Status
- [x] Verificación de reglas locales antes de sync en orquestador.
- [x] Sync bloqueado cuando no existen reglas; mensaje al usuario.
- [x] `make_rule.md` ofrecido cuando faltan reglas.
- [x] Watchers/reactivos respetan el mismo guard (no sync sin reglas).
