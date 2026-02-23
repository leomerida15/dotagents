# Roadmap: source_root → paths (array/objetos)

Plan para migrar el modelo de paths de valores únicos (`source_root`, `configPath`, `workspaceMarker`) a arrays de objetos que soporten archivos sueltos, carpetas y propósito explícito por ruta.

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Especificación esquema paths en YAML** | Definir esquema `paths` con scope, type, purpose; actualizar `context/pkg/rule/doc/rule.md`. | 🟢 completo |
| 2 | **YamlMapper y DTOs para paths** | Implementar parsing de `paths` en `packages/rule`; compatibilidad hacia atrás con `source_root`. | 🟢 completo |
| 3 | **KnownAgent y WorkspaceAgents** | Migrar `KnownAgent` a `paths[]`; actualizar generación desde rules. | 🟢 completo |
| 4 | **Adaptadores: FsAgentScanner, IdeWatcherService** | Adaptar detección y watchers para múltiples paths (archivos y carpetas). | 🟢 completo |
| 5 | **Reglas YAML y make_rule_prompt** | Migrar cursor/antigravity a `paths`; actualizar `make_rule_prompt.md` con nuevo esquema. | 🟢 completo |
| 6 | **Documentación comportamiento-actual-vs-planteado** | Actualizar `comportamiento-actual-vs-planteado.md`; cerrar dudas en `source_filePath.md`. | 🟢 completo |
