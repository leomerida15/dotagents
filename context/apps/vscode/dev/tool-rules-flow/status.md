# Rootmap: Tool + Rules Flow (Item 2.4)

Plan para implementar las reglas de negocio del item 2.4: herramienta obligatoria, selección+descarga de reglas, sync solo con reglas locales.

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Herramienta definida obligatoriamente** | No avanzar (no migrar, no sincronizar) hasta que el usuario seleccione herramienta. Si cancela, esperar. | 🟢 |
| 2 | **Seleccion + descarga de reglas** | Tras elegir herramienta, descargar sus reglas a `.agents/.ai/rules/{agentId}.yaml`. Usar en sync y migración. | 🟢 |
| 3 | **Solo reglas locales** | No ejecutar sync ni migración sin reglas locales. Migración usa reglas descargadas, no `DEFAULT_MIGRATION_RULES`. | 🟢 |
| 4 | **Bloquear sync sin reglas** | Si reglas no existen en GitHub, indicar `make_rule.md`. Bloquear sync hasta que existan localmente. | 🟢 |

*Leyenda Status: 🟢 completo | 🟡 incompleto | 🔴 error | 🔵 por hacer*

**Orden resumido:** herramienta definida → reglas en local → sync/migración.
