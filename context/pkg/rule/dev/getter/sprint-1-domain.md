# Sprint 1: Domain Definition

## Context
Definir el núcleo de la lógica de negocio del módulo `getter`. Este sprint se centra EXCLUSIVAMENTE en las **Entidades** y **Value Objects** que representan el conocimiento del dominio, sin ninguna dependencia externa ni contratos de infraestructura.

## Dependencies
- **Previous**: None
- **Next**: Sprint 2 (Application Definition)

## Steps to Execute

### 1. Definir Entidad `AgentRule`
- Crear la entidad que modela las reglas de un agente.
- Validar invariantes de dominio (ej: ID no vacío, estructura de mapeo válida).

### 2. Definir Value Objects
- `RuleSource`: Enum o VO para identificar origen (LOCAL, GITHUB).
- `AgentID`: VO para encapsular y validar identificadores de agentes.
- `MappingRule`: VO para representar una regla de mapeo individual (from/to).

## Status Checklist
- [x] Entidad `AgentRule` creada y testeada.
- [x] Value Objects (`RuleSource`, `AgentID`, `MappingRule`) definidos y testeados.
