# Plan: Conversión de Formato en el Motor de Sync

Plan para permitir que el motor de sincronización cambie el formato de archivos durante el sync (ej. `.mdc` ↔ `.md`) según lo indiquen las reglas de cada agente.

Refs: `context/pkg/diff/sync.md`, `context/pkg/diff/what-it-is.md`

## Estado General

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | [Sprint 1: Domain MappingRule](./sprint-1-domain-mapping-rule.md) | Extender MappingRule con sourceExt y targetExt para indicar conversión de extensión. | 🟢 completo |
| 2 | [Sprint 2: DTO y Schema](./sprint-2-dto-schema.md) | Actualizar MappingRuleDTO, schema Zod y persistencia en state.json. | 🟢 completo |
| 3 | [Sprint 3: Interpreter](./sprint-3-interpreter.md) | Aplicar conversión de extensión en DefaultSyncInterpreter al calcular rutas destino. | 🟢 completo |
| 4 | [Sprint 4: Schema YAML](./sprint-4-rule-schema-yaml.md) | Documentar source_ext y target_ext en el schema de reglas YAML. | 🟢 completo |
| 5 | [Sprint 5: YamlMapper](./sprint-5-yaml-mapper.md) | Parsear y pasar source_ext / target_ext desde YAML al dominio. | 🟢 completo |
| 6 | [Sprint 6: Integración](./sprint-6-integration.md) | Tests E2E y validación del flujo completo. | 🟢 completo |

## Leyenda de Status

- 🟢 completo
- 🟡 incompleto / en progreso
- 🔴 bloqueado / error
- 🔵 por hacer
