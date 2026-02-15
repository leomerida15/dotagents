# Sprint 1: Domain Definition & Shared Kernel

## Context
El módulo `client` necesita conceptos que ya existen en `getter` (como `AgentID`, `MappingRule`, `RuleSource`). Para evitar duplicación y permitir que `client` lea lo que `getter` escribió, debemos mover estos Value Objects a un kernel compartido (`src/shared/domain`). Además, definiremos la entidad `InstalledRule` específica del cliente (optimizada para lectura).

## Dependencies
- **Previous**: Getter Module Complete
- **Next**: Sprint 2 (Application Definition)

## Steps to Execute

### 1. Refactor to Shared Kernel
- Mover `AgentID`, `MappingRule`, `RuleSource` de `src/mods/getter/domain/value-objects` a `src/shared/domain/value-objects`.
- Actualizar `getter` para importar desde `shared`.

### 2. Define Client Domain
- Crear `InstalledRule` (Entity) en `src/mods/client/domain/entities`.
    - Similar a `AgentRule` pero quizás enfocada en *lectura* y aplicación de reglas (inmutabilidad).

## Status Checklist
- [x] `src/shared/domain` creado y poblado.
- [x] Módulo `getter` refactorizado para usar `shared`.
- [x] Entidad `InstalledRule` definida en `client`.
