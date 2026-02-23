# Sprint 2: YamlMapper y DTOs para paths

## Context

`packages/rule` usa `YamlMapper` para parsear reglas YAML. Actualmente lee `source_root` y lo mapea a `sourceRoot` (string). Hay que soportar el nuevo esquema `paths` manteniendo compatibilidad con `source_root` existente.

## Dependencies

- **Previous:** Sprint 1 (especificación).
- **Next:** Sprint 3 (KnownAgent) consume los DTOs de paths; Sprint 5 usa el mapper para leer reglas migradas.

## Pasos a ejecutar

1. Extender el esquema YAML en `YamlMapper.ts` para aceptar `paths` (array de objetos).
2. Crear DTO/tipo `PathEntry`: `{ path, scope?, type?, purpose? }`.
3. Derivar `sourceRoot` desde `paths` cuando exista (prioridad al primer `scope: "workspace"`, `purpose: "sync_source"` o `marker`).
4. Mantener fallback: si solo hay `source_root`, comportarse como hoy.
5. Añadir tests para ambos esquemas (legacy `source_root` y nuevo `paths`).

## Status

🟢 completo

## Checklist

- [x] PathEntry DTO/interface definido
- [x] YamlMapper acepta `paths`
- [x] Deriva sourceRoot desde paths cuando aplica
- [x] Fallback source_root funciona
- [x] Tests unitarios pasando
