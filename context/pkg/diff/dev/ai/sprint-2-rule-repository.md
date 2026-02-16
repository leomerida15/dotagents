# Sprint 2: Rule Repository [Rule]

## Context

Este sprint se centra en adaptar el repositorio de reglas (`FsInstalledRuleRepository`) en el paquete `@dotagents/rule` para que lea las reglas de simulación desde `.agents/.ai/rules/` en lugar de la raíz `.agents/.ai/`.
La idea es que el `getter` (descarga inicial de reglas) deposite los YAMLs en `.agents/.ai/rules/*.yaml`, y el `FsInstalledRuleRepository` los lea.

### Objetivos

*   Actualizar `FsInstalledRuleRepository` para buscar en `.agents/.ai/rules/`.
*   Definir el schema de las reglas de simulación (YAML) con `version`, `mapping.inbound`, etc.
*   Validar que el `getter` también deposite las reglas en `.agents/.ai/rules/`.

## Dependencies

*   **Bloqueado por**: [Sprint 1: Schema & Persistence](./sprint-1-schema-and-persistence.md)
*   **Bloquea a**: [Sprint 3: Simulation Engine](./sprint-3-simulation-engine.md)

## Checklist de Tareas

- [x] Actualizar `FsInstalledRuleRepository` path a `.agents/.ai/rules/`.
- [x] Validar que las reglas YAML (`mapping format`) sean entendidas por el `YamlMapper`.
- [x] Crear test de integración para validar la lectura de `.agents/.ai/rules/my-agent.yaml`.
- [x] Asegurarse de que el `getter` también use `.agents/.ai/rules/` durante la instalación inicial.

## Status

🟢 Completo

## Comentarios

- Actualmente el path es `.agents/.ai` raiz. Moverlo a subcarpeta `rules/` mejora la organización.
- El repositorio de reglas no debe modificar archivos, solo leer.
