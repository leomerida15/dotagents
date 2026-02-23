# Roadmap: Known Agents from Rules

Plan para derivar `WORKSPACE_KNOWN_AGENTS` desde la fuente de verdad de reglas (repo `rules/` y runtime `.agents/.ai/rules`), eliminando listas hardcodeadas. El roadmap **source-filepath** está completo: `KnownAgent` usa `paths[]`, el esquema YAML define `paths` y los adaptadores (FsAgentScanner, IdeWatcherService) ya consumen ese modelo.

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Build: generar WORKSPACE_KNOWN_AGENTS** | Script de build que escanea `rules/*.yaml`, extrae `agent.id` y `paths`, genera artefacto TS con `KnownAgent[]`. | 🟢 completo |
| 2 | **Runtime: custom rules en selector** | Incluir agentes de `.agents/.ai/rules/*.yaml` en el selector junto a WORKSPACE_KNOWN_AGENTS (parsear `paths` cuando exista). | 🟢 completo |
| 3 | **Unificar AddAgentManually con lista dinámica** | Reemplazar lista hardcodeada por WORKSPACE_KNOWN_AGENTS + reglas custom; mantener "Custom...". | 🟢 completo |
