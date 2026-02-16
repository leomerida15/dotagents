# Sprint 4: Integration Test

## Context

Este sprint se centra en validar todo el flujo end-to-end:
1. `init` crea `.agents/.ai/` y descarga reglas.
2. `diff` (VSCode) ejecuta la simulación usando las reglas de `.ai/rules`.
3. El estado se actualiza en `.ai/state.json`.

### Objetivos

*   Validar que la CLI (u otro cliente) inicialice `.agents/.ai/` correctamente.
*   Ejecutar sincronizaciones reales (de prueba) y verificar los archivos generados.
*   Asegurar que las carpetas y archivos en `.ai` se creen y actualicen como se espera.

## Dependencies

*   **Bloqueado por**: [Sprint 3: Simulation Engine](./sprint-3-simulation-engine.md)
*   **Bloquea a**: Despliegue en Producción

## Checklist de Tareas

- [x] Crear script de prueba de inicialización (CLI).
- [x] Ejecutar script para sincronizar VSCode -> .agents -> VSCode.
- [x] Validar que `.agents/.ai/state.json` contenga timestamps correctos.
- [x] Verificar que no se sobrescriban cambios si el timestamp es más reciente en destino.

## Status

✅ Completo

## Comentarios

- Es crucial validar casos borde: archivo borrado, archivo modificado en ambos lados, etc.
- Script de prueba puede ser un script de Node que simule un agente.
