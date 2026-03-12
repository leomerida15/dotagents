# Sprint 4 — TDD RED: DaemonFileLogger

## Context

Fase RED del TDD para `DaemonFileLogger`. Este componente maneja el logging asíncrono a archivos para los procesos background del daemon. Es crítico que sea **no bloqueante** y **resiliente a errores de disco**.

Usa `Bun.file().writer()` para append streams de alto rendimiento.

---

## Dependencies

- **Depende de**: Sprint 1 (necesita `ILogger` y `LogLevel`)
- **Bloqueador de**: Sprint 5 (implementación no puede empezar hasta tests RED verificados)

---

## Pasos a Ejecutar

### 1. Crear archivo de test

**Ruta**: `apps/cli/src/modules/logger/__tests__/daemon-file-logger.test.ts`

### 2. Behavior Contract — Tests a escribir

#### Happy Path
- [ ] Llamar `logger.info("started")` → append de `[TIMESTAMP] [INFO] started\n` al archivo de log
- [ ] Timestamp debe estar en formato ISO 8601
- [ ] Los mensajes se acumulan en el archivo (append, no overwrite)
- [ ] Soporte para `context` objeto: se serializa a JSON en la misma línea

#### Edge Cases
- [ ] Si el directorio del log no existe → lo crea automáticamente antes de escribir
- [ ] Si el directorio fue eliminado durante runtime → lo recrea en el próximo intento de escritura

#### Negative Path
- [ ] Si el archivo no es accesible (simulado con mock) → lanza error descriptivo o notifica sin crashear el proceso
- [ ] Referencia circular en `context` → serializa sin tirar excepción

### 3. Estructura del test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DaemonFileLogger } from '../infrastructure/bun-file-logger';
import { LogLevel } from '../domain/log-level.vo';
import { rmSync, existsSync, readFileSync } from 'fs';

const TEST_LOG_PATH = '/tmp/dotagents-test/daemon.log';
const TEST_LOG_DIR  = '/tmp/dotagents-test';

describe('DaemonFileLogger', () => {
  let logger: DaemonFileLogger;

  beforeEach(() => {
    if (existsSync(TEST_LOG_DIR)) rmSync(TEST_LOG_DIR, { recursive: true });
    logger = new DaemonFileLogger({ filePath: TEST_LOG_PATH });
  });

  afterEach(() => {
    if (existsSync(TEST_LOG_DIR)) rmSync(TEST_LOG_DIR, { recursive: true });
  });

  it('should create directory if not exists and write log entry', async () => {
    await logger.info('started');
    const content = readFileSync(TEST_LOG_PATH, 'utf-8');
    expect(content).toContain('[INFO]');
    expect(content).toContain('started');
  });

  it('should include ISO timestamp in log entry', async () => {
    await logger.info('event');
    const content = readFileSync(TEST_LOG_PATH, 'utf-8');
    expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  // ... demás tests
});
```

### 4. Verificar RED State

```bash
cd apps/cli && bun test src/modules/logger/__tests__/daemon-file-logger.test.ts
```

**Resultado esperado**: FAIL — `Cannot find module '../infrastructure/bun-file-logger'`

---

## Status

- [x] Archivo de test creado
- [x] Tests Happy Path escritos (append, timestamp ISO, acumulación)
- [x] Tests Edge Cases escritos (crear directorio, recrear si fue borrado)
- [x] Tests Negative Path escritos (error de acceso, referencia circular)
- [x] RED verificado: tests fallan por módulo faltante
- [x] Handoff documentado para Sprint 5

---

## Resultado

- **Archivo**: `apps/cli/src/modules/logger/__tests__/daemon-file-logger.test.ts`
- **Tests**: 8 total (4 Happy Path, 2 Edge Cases, 2 Negative Path)
- **Error esperado**: `Cannot find module '../infrastructure/daemon-file-logger'`
- **Fecha**: 2026-03-08
