# Sprint 2: Selección + descarga de reglas

## Context
Tras elegir herramienta, las reglas de esa herramienta deben descargarse a `.agents/.ai/rules/{agentId}.yaml`. Estas reglas son las que se usan en sync y migración. Actualmente `FetchAndInstallRulesUseCase` descarga para todos los agentes detectados en `config.agents`, antes de la selección.

## Dependencis
- **Previous:** Sprint 1 (herramienta obligatoria): la herramienta debe estar seleccionada antes de este paso.
- **Next:** Sprint 3 y 4 usan las reglas descargadas para sync y migración.

## Pasos a ejecutar
- Ajustar el flujo para que tras `selectActiveAgent` se descarguen las reglas solo de la herramienta seleccionada (o al menos se asegure que esa herramienta tenga reglas).
- Evaluar si `FetchAndInstallRulesUseCase` debe aceptar `agentIds: string[]` opcional para descargar solo los necesarios.
- Si el proyecto es nuevo: crear estructura mínima `.agents/.ai/rules` antes de descargar.
- Las reglas descargadas se usan en los pasos siguientes (sync, migración).

## Status
- [x] Reglas se descargan tras la selección de herramienta.
- [x] Reglas de la herramienta activa disponibles en `.agents/.ai/rules/{agentId}.yaml`.
- [x] Documentar o implementar variante de fetch por agentId(s) si aplica.
