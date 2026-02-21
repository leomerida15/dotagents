# Roadmap: Core Engine Integration (Módulo 3)

Plan para reemplazar mocks con lógica real de `@dotagents/diff`: inicialización de proyecto, persistencia de `state.json`, adapter de sync bidireccional e integración con el motor de sincronización.

Referencia: `context/project/reports/comportamiento-actual-vs-planteado.md`

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Inicialización del proyecto** | Crear `.agents` y `.agents/.ai` si no existen; `InitializeProjectUseCase`, `NodeConfigRepository`. | 🟢 completo |
| 2 | **Adapter de sync inbound** | `DiffSyncAdapter` conectando VSCode con `SyncProjectUseCase`; sync IDE → `.agents`. | 🟢 completo |
| 3 | **Sync outbound** | Sync `.agents` → IDE usando `rule.mappings.outbound`. | 🟢 completo |
| 4 | **Sync incremental y manifest** | Solo archivos afectados (`affectedPaths`); actualizar `manifest` en `state.json` tras cada sync. | 🟢 completo |
