# Sprint 3: Selector de IDE en sync manual

## Context
El reporte indica que "Elegir IDE en el diálogo" está parcial: el selector solo aparece cuando `currentAgent` es null o difiere del IDE host. El requisito 6 plantea elegir IDE explícitamente en sync manual.

## Dependencies
- **Previous:** Sprint 2 (flujo base funcional).
- **Next:** Ninguno; cierra la brecha del módulo 3.6.

## Pasos a ejecutar
- Mostrar siempre el selector de herramienta en sync manual.
- Orden del flujo: herramienta → dirección → sync.
- Persistir `currentAgent` cuando el usuario elige una herramienta distinta en sync manual.

## Status
- [x] El usuario puede elegir herramienta en cada sync manual.
- [x] `currentAgent` se actualiza si el usuario selecciona otra herramienta.
- [x] Flujo documentado (orden: herramienta → dirección → sync).
