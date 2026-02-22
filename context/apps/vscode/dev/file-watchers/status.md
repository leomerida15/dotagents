# Roadmap: File Watchers IDE <-> .agents (Requisito 4)

Plan para implementar watchers reactivos que escuchen cambios en el IDE y en `.agents`, actualicen el puente y `state.json`, y solo modifiquen archivos afectados.

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Watcher IDE** | Escuchar cambios en archivos del IDE (source roots: .cursor, .cline, etc.). | 🟢 completo |
| 2 | **Watcher .agents** | Escuchar cambios en `.agents` (excl. `.agents/.ai/`). | 🟢 completo |
| 3 | **Integracion sync reactivo** | Conectar watchers con sync, actualizar `state.json`; sync incremental. | 🟢 completo |
| 4 | **Prevenir bucle sync** | Distinguir cambios del motor vs externos; ignorar rutas recién escritas por el sync. | 🟢 completo |
| 5 | **Simplificar manifest** | Eliminar `manifest.agents.agents` redundante; usar solo `manifest.lastProcessedAt` como bridge. | 🟢 completo |
