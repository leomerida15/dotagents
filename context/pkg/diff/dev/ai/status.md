# Plan de Trabajo: .agents/.ai (Simulation Engine)

Este documento define la hoja de ruta para implementar la estructura interna `.agents/.ai/` en el proyecto `@dotagents/diff` y `@dotagents/rule`.

El objetivo es separar la "configuración pública" (`.agents/rules/*.md`) de la "configuración interna del motor" (`.agents/.ai/rules/*.yaml` y `.agents/.ai/state.json`) para permitir simulaciones y control de estado preciso mediante timestamps.

## Estado General del Proyecto

| Index | Name | Descripción | Status |
|---|---|---|---|
| 1 | **[Sprint 1: Schema & Persistence](./sprint-1-schema-and-persistence.md)** | Definir la estructura de `.agents/.ai` y migrar la persistencia del estado (`SyncManifest`) a `state.json`. | 🔵 |
| 2 | **[Sprint 2: Rule Repository](./sprint-2-rule-repository.md)** | Adaptar `FsInstalledRuleRepository` para leer las reglas de simulación desde `.agents/.ai/rules/`. | 🔵 |
| 3 | **[Sprint 3: Simulation Engine](./sprint-3-simulation-engine.md)** | Actualizar el `SyncInterpreter` para usar las reglas `.ai` y calcular acciones (`SyncAction`) antes de ejecutarlas. | 🔵 |
| 4 | **[Sprint 4: Integration Test](./sprint-4-integration-test.md)** | Probar el flujo completo (Getter -> .ai/rules -> Interpreter -> Filesystem) en la CLI/VSCode. | 🔵 |

## Leyenda de Status

- 🟢: Completo
- 🟡: Incompleto / En Progreso
- 🔴: Bloqueado / Error
- 🔵: Por Hacer
