# Sprint 2: AgentHostDetector dinámico

## Context

`AgentHostDetector` (o `detectAgentFromHostApp`) usa lógica hardcodeada: comprueba `vscode.env.appName` contra strings fijos ('cline', 'cursor', 'windsurf', 'opencode', 'vscode') y devuelve 'cursor' como fallback. Debe usar `WORKSPACE_KNOWN_AGENTS` para detectar dinámicamente si algún `agent.id` aparece en `appName` (normalizado a minúsculas). El fallback cuando no hay coincidencia debe ser `"vscode"` en lugar de `"cursor"`.

## Dependencis

- **Previous:** Sprint 1 (Known agents solo GitHub) — la lista reducida define qué IDs buscar.
- **Next:** Sprint 3 (IDE no reconocido) — cuando no hay coincidencia, se informa al usuario.

## Pasos a ejecutar

1. En `apps/vscode/src/modules/orchestrator/infra/AgentHostDetector.ts` (o donde esté `detectAgentFromHostApp`), importar `WORKSPACE_KNOWN_AGENTS`.
2. Sustituir las comprobaciones hardcodeadas por un bucle: iterar sobre `WORKSPACE_KNOWN_AGENTS` y devolver `agent.id` si `appName.toLowerCase().includes(agent.id)`.
3. Cambiar el fallback de `'cursor'` a `'vscode'` cuando no hay coincidencia.
4. Mantener el orden de búsqueda coherente (p. ej. coincidencias más específicas primero si aplica).

## Status

🟢 completo

## Checklist

- [x] Sustituir comprobaciones fijas por bucle sobre `WORKSPACE_KNOWN_AGENTS`
- [x] Fallback devuelve `"vscode"` en lugar de `"cursor"`
- [x] Detección funciona para antigravity y cursor según `appName`
- [x] Tests actualizados
