# Sprint 3: Interpreter [diff]

## Context

El `DefaultSyncInterpreter` actualmente calcula el target path concatenando la ruta base con `relPart` sin transformar extensiones. Debe aplicar la conversión de formato cuando la regla lo indique.

## Dependencies

- **Depende de**: [Sprint 1: Domain MappingRule](./sprint-1-domain-mapping-rule.md), [Sprint 2: DTO y Schema](./sprint-2-dto-schema.md)
- **Bloquea a**: [Sprint 6: Integración](./sprint-6-integration.md)

## Pasos a ejecutar

1. Crear función helper para transformar extensión: dado un path y la regla, devolver el path destino con extensión convertida si aplica.
2. En `interpret()` (modo full): al generar acciones COPY, si la regla tiene `sourceExt`/`targetExt` y el archivo termina en `sourceExt`, usar `targetExt` en el target.
3. En `interpretIncremental()`: aplicar la misma lógica al mapear `relPart` al target.
4. Para reglas de directorio: iterar archivos y aplicar conversión solo a los que coincidan con `sourceExt`.
5. Definir comportamiento cuando hay múltiples extensiones en el mismo directorio (documentar decisión).

## Checklist de Tareas

- [x] Helper `applyFormatConversion(path, rule): string` o similar.
- [x] Integrar conversión en flujo full e incremental.
- [x] Tests unitarios: archivo único, directorio recursivo, modo incremental con conversión.
- [x] Tests edge: regla sin conversión (comportamiento actual), regla con conversión parcial.

## Status

🟢 completo
