# Sprint 1: Domain + Ports

## Context
Necesitamos una forma explicita de verificar si existe una regla instalada para una herramienta, usando el repositorio de reglas ya persistidas en `.agents/.ai/rules`.

## Dependencis
- Previous: None
- Next: Sprint 2 (Application Use Case)

## Pasos a ejecutar
- Definir contrato en `IInstalledRuleRepository` para existencia (`existsRule` o similar).
- Definir un DTO de salida para existencia (`RuleExistenceDTO`).
- Definir comportamiento cuando el directorio de reglas no existe (retornar `exists=false`).

## Notas para sprints 2/3
- Sprint 2 debe consumir el contrato `existsRule` y devolver `RuleExistenceDTO` en los casos de uso.
- Sprint 3 debe implementar `existsRule` en el repositorio FS con acceso rapido al archivo y sin parseo de YAML.

## Status
- [x] Contrato de existencia definido en el puerto.
- [x] DTO de existencia definido y documentado.
- [x] Reglas de comportamiento en errores definidas.
