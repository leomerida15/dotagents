# Sprint 1: Deteccion de reglas faltantes

## Context
Tras ejecutar FetchAndInstallRules, algunos agentes pueden no tener reglas instaladas (por fallo de descarga o porque no existen en el repositorio). Debemos identificar cuáles son para poder notificarlos al usuario.

## Dependencis
- Previous: None
- Next: Sprint 2 (Notificacion UI)

## Pasos a ejecutar
- Usar `ClientModule.createVerifyRulesExistenceUseCase()` con la lista de agentIds de la config.
- Obtener la lista de agentes cuyo `exists === false`.
- Exponer o devolver esa lista para uso del sprint 2.

## Status
- [x] Uso de VerifyRulesExistenceUseCase documentado o implementado.
- [x] Lista de agentes sin reglas disponible tras FetchAndInstallRules.
