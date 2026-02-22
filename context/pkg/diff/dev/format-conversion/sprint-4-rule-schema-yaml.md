# Sprint 4: Schema YAML [rules]

## Context

Las reglas de agentes se definen en YAML (ej. `rules/cursor.yaml`, `rules/antigravity.yaml`). El schema debe documentar cómo indicar la conversión de formato en los mappings inbound y outbound.

## Dependencies

- **Depende de**: [Sprint 1: Domain MappingRule](./sprint-1-domain-mapping-rule.md) (para conocer el contrato de campos)
- **Bloquea a**: [Sprint 5: YamlMapper](./sprint-5-yaml-mapper.md)

## Pasos a ejecutar

1. Actualizar `context/pkg/rule/doc/rule.md` con la documentación de `source_ext` y `target_ext`.
2. Añadir ejemplos en mappings de directorio (ej. `rules/` con `.mdc` → `.md`).
3. Aclarar semántica: inbound vs outbound (la conversión se invierte según la dirección).

## Checklist de Tareas

- [x] Documentar `source_ext` y `target_ext` en el schema de reglas.
- [x] Ejemplo YAML para mapping con conversión de formato.
- [x] Nota sobre bidireccionalidad (inbound: agente→.agents, outbound: .agents→agente).

## Status

🟢 completo
