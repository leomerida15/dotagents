# Sprint 2: DTO y Schema [diff]

## Context

Los DTOs y el schema Zod deben reflejar los nuevos campos de `MappingRule` para que las reglas puedan ser serializadas, persistidas y consumidas por el intérprete.

## Dependencies

- **Depende de**: [Sprint 1: Domain MappingRule](./sprint-1-domain-mapping-rule.md)
- **Bloquea a**: [Sprint 3: Interpreter](./sprint-3-interpreter.md), [Sprint 5: YamlMapper](./sprint-5-yaml-mapper.md)

## Pasos a ejecutar

1. Actualizar `MappingRuleSchema` en `MappingRuleDTO.ts` con `sourceExt` y `targetExt` opcionales.
2. Actualizar `BunConfigRepository` para incluir estos campos al guardar/cargar agentes en `state.json`.
3. Verificar que `SyncProjectRequestDTO` y cualquier mapper que use `MappingRuleDTO` soporten los nuevos campos.

## Checklist de Tareas

- [x] Añadir `sourceExt`, `targetExt` al `MappingRuleSchema` (z.string().optional()).
- [x] Actualizar `BunConfigRepository` para serializar/deserializar estos campos.
- [x] Tests unitarios/integración para persistencia round-trip con conversión de formato.

## Status

🟢 Completo
