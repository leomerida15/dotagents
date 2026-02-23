# Roadmap: Sync new y cambio de herramienta

Plan para ejecutar sync bidireccional (.agents → IDE, IDE → .agents) cuando se cambia de herramienta o se agrega una nueva, con reglas locales ya existentes.

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Sync new bidireccional** | Ejecutar outbound + inbound (sin affectedPaths) al cambiar herramienta cuando hay reglas. | 🟢 completo |
| 2 | **Add Agent Manual flow** | Extender Add Agent Manually para añadir agente a config y disparar sync new si hay reglas locales. | 🟢 completo |
| 3 | **Integración en cambio de herramienta** | Disparar sync new tras selectActiveAgent; verificar orden regla → herramienta. | 🟢 completo |
