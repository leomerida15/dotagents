# Sprint 4: Prevenir bucle sync

## Context

Los cambios que escribe el motor durante un inbound sync (IDE → `.agents`) son detectados por el outbound watcher, ya que escribe en `.agents/rules/`, `.agents/skills/`, etc. Eso dispara outbound sync, que escribe en `.cursor/`, y el inbound watcher detecta esos cambios, cerrando un ciclo infinito. Hay que distinguir cambios propios del motor de cambios externos (usuario u otras herramientas).

## Dependencis

- **Previous:** Sprint 3 (Integracion sync reactivo)
- **Next:** Sprint 5 (Simplificar manifest) puede beneficiarse de menos ruido en timestamps

## Pasos a ejecutar

1. Crear estructura para rutas ignoradas temporalmente: `Set<string>` con rutas que el motor acaba de escribir + timestamp de expiración.
2. Modificar `runReactiveInboundSync`: tras sync inbound, registrar en la lista de ignorar los paths que se escribieron en `.agents/` (derivar desde `affectedPaths` o desde el resultado del sync).
3. Modificar `runReactiveOutboundSync`: tras sync outbound, registrar en la lista de ignorar los paths que se escribieron en el IDE (ej. `.cursor/`).
4. En `scheduleInboundSync` y `scheduleOutboundSync`, comprobar si la URI está en la lista de ignorar; si sí, omitir el schedule.
5. Limpiar entradas expiradas de la lista (ej. 500–600 ms tras el sync).
6. Opcional: cooldown global post-sync como red de seguridad (no procesar eventos del watcher opuesto durante 200–400 ms tras un sync).

## Status

🟢 completo

## Checklist

- [x] Crear `IgnoredPathsRegistry` o equivalente (Set + Map de path → expiry)
- [x] Pasar rutas escritas desde `DiffSyncAdapter` / sync engine a los handlers de `extension.ts`
- [x] Registrar rutas escritas tras inbound sync en la lista de ignorar
- [x] Registrar rutas escritas tras outbound sync en la lista de ignorar
- [x] Filtrar en `scheduleInboundSync` si la URI está ignorada
- [x] Filtrar en `scheduleOutboundSync` si la URI está ignorada
- [x] Implementar limpieza de entradas expiradas
- [x] Cooldown global post-sync
- [x] Tests unitarios (IgnoredPathsRegistry.test.ts); verificación manual pendiente por el usuario
