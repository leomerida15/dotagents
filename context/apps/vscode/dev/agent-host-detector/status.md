# Roadmap: Agent Host Detector y Known Agents

Plan para alinear la detección de IDE con la fuente de verdad de reglas en GitHub. Solo se reconocen agentes que tienen reglas publicadas.

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Known agents solo GitHub** | Reducir `WORKSPACE_KNOWN_AGENTS` a agentes con reglas en el repo (antigravity, cursor). | 🟢 completo |
| 2 | **AgentHostDetector dinámico** | Detectar IDE con bucle sobre `WORKSPACE_KNOWN_AGENTS`; fallback `"vscode"` en lugar de `"cursor"`. | 🟢 completo |
| 3 | **IDE no reconocido** | Informar al usuario cuando el IDE no está en la lista (Add Agent Manually / make_rule_prompt). | 🟢 completo |
