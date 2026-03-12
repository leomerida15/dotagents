# Sprint 2 — TDD RED: CliLogger

## Context

Este sprint ejecuta la **fase RED del TDD** para el componente `CliLogger`. Escribe todos los tests de comportamiento **antes** de que exista la implementación. Los tests deben fallar por razones correctas (módulo no existe), no por errores de configuración de tests.

`CliLogger` es un adapter de Infrastructure que implementa `ILogger` y produce salida en terminal con colores ANSI según niveles de log.

---

## Dependencies

- **Depende de**: Sprint 1 (necesita `ILogger`, `LogLevel`, `LogEntry` definidos)
- **Bloqueador de**: Sprint 3 (implementación no puede empezar hasta que los tests RED estén verificados)

---

## Pasos a Ejecutar

### 1. Configurar bun:test en el proyecto

Verificar/añadir script de test en `package.json`:
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch"
  }
}
```

### 2. Crear archivo de test

**Ruta**: `apps/cli/src/modules/logger/__tests__/cli-logger.test.ts`

### 3. Behavior Contract — Tests a escribir

#### Happy Path
- [ ] `logger.info("ready")` → imprime `[INFO] ready` con prefijo en color cian a stdout
- [ ] `logger.warn("alert")` → imprime `[WARN] alert` con prefijo en color amarillo
- [ ] `logger.error("fail")` → imprime `[ERROR] fail` con prefijo en color rojo
- [ ] `logger.debug("trace")` → imprime `[DEBUG] trace` con prefijo en color gris

#### Edge Cases
- [ ] Pasar un objeto grande como `context` → debe serializar con `JSON.stringify` (no debe lanzar excepción)
- [ ] Pasar `undefined` como `context` → omite el contexto en la salida

#### Negative Path
- [ ] Configurar threshold en `WARN` y llamar `logger.debug()` → no produce ninguna salida
- [ ] Configurar threshold en `WARN` y llamar `logger.info()` → no produce ninguna salida
- [ ] Configurar threshold en `WARN` y llamar `logger.warn()` → SÍ produce salida

### 4. Estructura del test

```typescript
import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { CliLogger } from '../infrastructure/bun-console-logger';
import { LogLevel } from '../domain/log-level.vo';

describe('CliLogger', () => {
  let logger: CliLogger;
  let consoleSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    logger = new CliLogger({ level: LogLevel.DEBUG });
    consoleSpy = spyOn(console, 'log');
  });

  describe('info()', () => {
    it('should output [INFO] prefixed message in cyan', () => {
      logger.info('ready');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('ready')
      );
    });
  });

  // ... demás tests
});
```

### 5. Verificar RED State

```bash
cd apps/cli && bun test src/modules/logger/__tests__/cli-logger.test.ts
```

**Resultado esperado**: FAIL — `Cannot find module '../infrastructure/bun-console-logger'`

---

## Status

- [x] `package.json` tiene script `test`
- [x] Archivo de test creado en la ruta correcta
- [x] Tests Happy Path escritos
- [x] Tests Edge Cases escritos
- [x] Tests Negative Path escritos
- [x] RED verificado: tests fallan por módulo faltante (no por error de sintaxis)
- [x] Handoff documentado para Sprint 3

---

## Resultado

- **Tests creados**: 9 (4 happy path, 2 edge cases, 3 negative path)
- **Archivo**: `apps/cli/src/modules/logger/__tests__/cli-logger.test.ts`
- **Error esperado**: `Cannot find module '../infrastructure/cli-logger'`
- **Fecha**: 2026-03-08
