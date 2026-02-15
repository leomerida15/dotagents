# Sprint 2: Application Definition

## Context
Definir cómo una aplicación externa (CLI/IDE) consulta las reglas instaladas.

## Dependencies
- **Previous**: Sprint 1 (Domain Definition)
- **Next**: Sprint 3 (Infrastructure Implementation)

## Steps to Execute

### 1. Definir Puertos (Ports)
- `IInstalledRuleRepository`: Contrato para leer de `.agents/.ai`.
    - `getRule(agentId: AgentID): Promise<InstalledRule | null>`
    - `getAllRules(): Promise<InstalledRule[]>`

### 2. Definir DTOs
- `InstalledRuleDTO`: Objeto de transferencia para mostrar reglas en UI/CLI.

### 3. Implementar Casos de Uso
- `GetInstalledRuleUseCase`: Obtiene detalles de una regla.
- `ListInstalledRulesUseCase`: Lista qué agentes tienen reglas instaladas.

## Status Checklist
- [x] Puerto `IInstalledRuleRepository` definido.
- [x] DTO `InstalledRuleDTO` definido.
- [x] Casos de uso implementados.
