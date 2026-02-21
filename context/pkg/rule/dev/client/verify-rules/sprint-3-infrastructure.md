# Sprint 3: Infrastructure + Integration

## Context
El repositorio FS debe poder responder rapidamente si existe un archivo de regla para un agente sin parsear todo el contenido.

## Dependencis
- Previous: Sprint 2 (Application Use Case)
- Next: Done

## Pasos a ejecutar
- Implementar `existsRule` en `FsInstalledRuleRepository` usando `accessSync` o equivalente.
- Agregar tests para: directorio inexistente, archivo faltante y archivo presente.
- Exponer los casos de uso en `ClientModule` e `index.ts`.

## Status
- [x] Repositorio FS implementa verificacion de existencia.
- [x] Tests de existencia agregados y pasando.
- [x] API publica actualizada para exponer los casos de uso.
