# Sprint 1: Especificación esquema paths en YAML

## Context

Actualmente el YAML usa `source_root` único (ej. `.cursor/`, `.agent/`). Esto no cubre: (1) antigravity con distintos paths en workspace (`.agent`) y home (`~/.gemini/antigravity`); (2) agentes con archivos sueltos en raíz (claude-code, opencode). Se debe definir un esquema `paths` como array de objetos con `path`, `scope`, `type` y `purpose`.

## Dependencies

- **Previous:** Ninguno.
- **Next:** Sprint 2 (YamlMapper) depende de este esquema; Sprint 5 (reglas) requiere la especificación para migrar.

## Pasos a ejecutar

1. Definir formalmente el esquema `paths` en el reporte `context/project/reports/source_filePath.md`:
   - Estructura: `path`, `scope` (workspace | home), `type` (file | directory), `purpose` (marker | sync_source | config).
2. Actualizar `context/pkg/rule/doc/rule.md` con la nueva sección del esquema `paths`:
   - Incluir ejemplos para carpeta única (cursor), paths distintos (antigravity), archivos sueltos (claude-code).
   - Documentar compatibilidad hacia atrás con `source_root` (opcional durante migración).
3. Añadir ejemplos YAML en la documentación.

## Status

🟢 completo

## Checklist

- [x] Esquema `paths` documentado en source_filePath.md
- [x] `context/pkg/rule/doc/rule.md` actualizado con nuevo esquema
- [x] Ejemplos YAML para cursor, antigravity, claude-code
- [x] Convención de fallback `source_root` documentada
