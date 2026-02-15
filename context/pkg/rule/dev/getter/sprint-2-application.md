# Sprint 2: Application Definition

## Context
Definir la capa de Orquestación y Comunicación. Aquí estableceremos los **Puertos (Interfaces)** que la infraestructura debe implementar, los **DTOs** para el transporte de datos, y los **Casos de Uso** que ejecutan la lógica.

## Dependencies
- **Previous**: Sprint 1 (Domain Definition)
- **Next**: Sprint 3 (Infrastructure Implementation)

## Steps to Execute

### 1. Definir Puertos (Ports)
- `IRuleProvider`: Puerto secundario (driven) para obtener reglas.
- `IRuleRepository`: Puerto secundario (driven) para persistir reglas.

### 2. Definir DTOs
- `GetRuleRequestDTO`: Datos de entrada para solicitar una regla.
- `AgentRuleDTO`: Datos de salida planos de una regla.

### 3. Implementar Casos de Uso
- `GetAgentRuleUseCase`: Orquesta la obtención via Provider y persistencia via Repository.
- Asegura la conversión entre DTOs y Entidades de Dominio.

## Status Checklist
- [x] Puertos `IRuleProvider` e `IRuleRepository` definidos.
- [x] DTOs `GetRuleRequestDTO` y `AgentRuleDTO` creados.
- [x] Caso de Uso `GetAgentRuleUseCase` implementado y testeado unitariamente.
