# Sprint 5: YamlMapper [rules]

## Context

El `YamlMapper` del paquete `@dotagents/rule` convierte YAML a dominio. Debe parsear `source_ext` y `target_ext` y pasarlos al crear los `MappingRule` que consume el motor de sync.

## Dependencies

- **Depende de**: [Sprint 2: DTO y Schema](./sprint-2-dto-schema.md), [Sprint 4: Schema YAML](./sprint-4-rule-schema-yaml.md)
- **Bloquea a**: [Sprint 6: Integración](./sprint-6-integration.md)

## Pasos a ejecutar

1. Actualizar `YamlRuleSchema` (o equivalente) para incluir `source_ext` y `target_ext` en inbound y outbound.
2. Actualizar `YamlMapper.toDomain()` para pasar estos campos al crear `MappingRule`.
3. Verificar que el `MappingRule` del paquete rules sea compatible con el de diff, o que exista el adapter que traduzca entre ambos.
4. Tests de integración: parsear YAML con conversión y verificar que los objetos de dominio tengan los valores correctos.

## Checklist de Tareas

- [x] Añadir `source_ext`, `target_ext` al schema de mapeo YAML en YamlMapper.
- [x] Mapear a dominio en inbound y outbound.
- [x] Tests: parse YAML con format conversion y assert dominio.
- [x] Verificar puente rules → diff (adaptador en VSCode/orquestador si aplica).

## Status

🟢 completo
