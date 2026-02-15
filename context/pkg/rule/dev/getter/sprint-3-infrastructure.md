# Sprint 3: Infrastructure Implementation

## Context
Implementar los adaptadores concretos para los puertos definidos en la capa de Aplicación. Conectar con el mundo real (GitHub, FileSystem).

## Dependencies
- **Previous**: Sprint 2 (Application Definition)
- **Next**: Sprint 4 (Integration)

## Steps to Execute

### 1. Implementar `LocalRuleProvider`
- Adaptador de `IRuleProvider` para leer archivos locales.

### 2. Implementar `GitHubRuleProvider`
- Adaptador de `IRuleProvider` para fetching desde GitHub.

### 3. Implementar `BunRuleRepository`
- Adaptador de `IRuleRepository` que persiste en `.agents/.ai/`.

### 4. Mapper Implementations
- Implementar Mappers de Infraestructura (YAML -> DTO/Entity).

## Status Checklist
- [x] `LocalRuleProvider` implementado.
- [x] `GitHubRuleProvider` implementado.
- [x] `BunRuleRepository` implementado.
- [x] Mappers implementados.
- [ ] Tests de integración para adaptadores.
