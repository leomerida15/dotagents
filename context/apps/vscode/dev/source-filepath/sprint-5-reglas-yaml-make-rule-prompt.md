# Sprint 5: Reglas YAML y make_rule_prompt

## Context

Las reglas `rules/cursor.yaml` y `rules/antigravity.yaml` usan `source_root`. Hay que migrarlas al nuevo esquema `paths` y actualizar la guía de creación de reglas para que los usuarios generen YAML con `paths`.

## Dependencies

- **Previous:** Sprints 1–4.
- **Next:** Sprint 6 (documentación final) documenta el estado resultante.

## Pasos a ejecutar

1. Migrar `rules/cursor.yaml` a `paths`:
   - `path: ".cursor/"`, `scope: "workspace"`, `type: "directory"`, `purpose: "marker"`
   - `path: ".cursor"`, `scope: "home"`, `type: "directory"`, `purpose: "config"`
2. Migrar `rules/antigravity.yaml` a `paths`:
   - `path: ".agent/"`, `scope: "workspace"`, `type: "directory"`, `purpose: "marker"`
   - `path: ".gemini/antigravity"`, `scope: "home"`, `type: "directory"`, `purpose: "config"`
3. **Actualizar `apps/vscode/access/make_rule_prompt.md`**:
   - Sustituir el esquema con `source_root` por el esquema con `paths`.
   - Incluir ejemplos para carpeta única, paths distintos y archivos sueltos.
4. Verificar que el build y tests siguen pasando con reglas migradas.

## Status

🟢 completo

## Checklist

- [x] rules/cursor.yaml migrado a paths
- [x] rules/antigravity.yaml migrado a paths
- [x] make_rule_prompt.md actualizado con esquema paths
- [x] Ejemplos en make_rule_prompt para distintos casos
- [x] Build y tests pasando
