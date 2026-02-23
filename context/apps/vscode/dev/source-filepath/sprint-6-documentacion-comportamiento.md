# Sprint 6: Documentación comportamiento-actual-vs-planteado

## Context

El informe `context/project/reports/comportamiento-actual-vs-planteado.md` describe el estado de la extensión y el diseño planteado. Tras la migración a `paths`, debe reflejar el nuevo modelo de datos. Además, `context/project/reports/source_filePath.md` contiene dudas abiertas que deben cerrarse o actualizarse.

## Dependencies

- **Previous:** Sprints 1–5.
- **Next:** Ninguno (cierre del roadmap).

## Pasos a ejecutar

1. **Actualizar `context/project/reports/comportamiento-actual-vs-planteado.md`**:
   - En la estructura de `state.json` (sección 4.2), documentar que `agents[].sourceRoot` puede derivarse de `paths` o mantenerse por compatibilidad.
   - En la tabla de `agents` (sección 4.3), añadir nota sobre `paths` opcional.
   - En dependencias técnicas (sección 6), indicar que `WORKSPACE_KNOWN_AGENTS` y las reglas YAML usan `paths`.
   - Añadir entrada en "Cambios de comportamiento" o nueva sección "Paths como array".
2. **Actualizar `context/project/reports/source_filePath.md`**:
   - Cerrar dudas 1–4 con las decisiones tomadas.
   - Dejar referencias al esquema final y a `context/pkg/rule/doc/rule.md`.
3. Revisar referencias cruzadas entre documentos.

## Status

🟢 completo

## Checklist

- [x] comportamiento-actual-vs-planteado.md actualizado con modelo paths
- [x] source_filePath.md con dudas cerradas
- [x] Referencias cruzadas correctas
