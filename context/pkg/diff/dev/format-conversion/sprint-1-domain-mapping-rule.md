# Sprint 1: Domain MappingRule [diff]

## Context

El motor de sync actualmente preserva nombres y extensiones 1:1. Para soportar agentes con distintos formatos (ej. Cursor `.mdc` vs Antigravity `.md`), el dominio debe poder expresar la conversión de extensión en cada regla de mapping.

## Dependencies

- **Bloquea a**: [Sprint 2: DTO y Schema](./sprint-2-dto-schema.md), [Sprint 3: Interpreter](./sprint-3-interpreter.md)

## Pasos a ejecutar

1. Extender `MappingRuleProps` con `sourceExt?: string` y `targetExt?: string`.
2. Actualizar el constructor y `MappingRule.create()` para aceptar y validar estos campos.
3. Añadir getters `sourceExt` y `targetExt` en `MappingRule`.
4. Actualizar `equals()` para incluir la comparación de estos campos.
5. Mantener compatibilidad hacia atrás: si no se especifican, la regla comporta como hoy (sin conversión).

## Checklist de Tareas

- [x] Extender `MappingRuleProps` con `sourceExt`, `targetExt`.
- [x] Validación: si se especifica uno, ambos deben estar presentes; extensiones deben empezar por `.`.
- [x] Tests unitarios para `MappingRule` con y sin conversión de formato.

## Status

🟢 Completo
