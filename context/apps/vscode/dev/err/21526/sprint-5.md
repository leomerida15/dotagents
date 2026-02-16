# Sprint 5: Pruebas de Integración

## Context
Este sprint final valida que todas las refactorizaciones realizadas en los Sprints 1-4 funcionen correctamente en conjunto. Se crearán pruebas de integración end-to-end y se verificará el comportamiento del sistema completo en un escenario real.

**Archivos Involucrados:**
- `packages/diff/tests/integration/` (nuevo directorio)
- `apps/vscode/tests/integration/` (nuevo directorio)
- Scripts de testing en `packages/diff/package.json`
- Configuración de testing (`vitest.config.ts` o similar)

---

## Dependencies

### Dependencias Previas
- **Sprint 1**: Dominio completamente refactorizado
- **Sprint 2**: ConfigRepository con rutas correctas
- **Sprint 3**: AgentScanner con detección real
- **Sprint 4**: DTOs y contratos alineados

### Sprints Dependientes
- Ninguno (Sprint final)

---

## Pasos a Ejecutar

### 1. Configurar el entorno de testing

#### Seleccionar framework de testing
- [ ] Confirmar el uso de Vitest (recomendado para Bun/TypeScript)
- [ ] Instalar dependencias: `bun add -D vitest @vitest/ui`
- [ ] Crear `vitest.config.ts` en `packages/diff/`

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@dotagents/diff': resolve(__dirname, './src'),
    },
  },
});
```

- [ ] Configurar scripts en `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:integration": "vitest run --testPathPattern=integration"
  }
}
```

### 2. Crear pruebas de integración para el paquete `@dotagents/diff`

#### Test 1: Inicialización de Proyecto
**Archivo**: `packages/diff/tests/integration/initialize-project.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { InitializeProjectUseCase } from '@dotagents/diff';

describe('InitializeProjectUseCase - Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'dotagents-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('debe crear la estructura .agents/ correctamente', async () => {
    // Test implementation
  });

  it('debe generar state.json con la estructura correcta', async () => {
    // Test implementation
  });

  it('debe detectar agentes instalados en el sistema', async () => {
    // Test implementation
  });
});
```

- [ ] Implementar el test de creación de estructura
- [ ] Implementar el test de generación de state.json
- [ ] Implementar el test de detección de agentes
- [ ] Añadir cleanup automático de directorios temporales

#### Test 2: Sincronización Completa
**Archivo**: `packages/diff/tests/integration/sync-flow.test.ts`

- [ ] Crear test de sincronización inbound
- [ ] Crear test de sincronización outbound
- [ ] Crear test de detección de cambios
- [ ] Validar actualización de timestamps

#### Test 3: Persistencia y Recuperación
**Archivo**: `packages/diff/tests/integration/config-persistence.test.ts`

```typescript
describe('Configuration Persistence - Integration', () => {
  it('debe guardar y recuperar la configuración correctamente', async () => {
    // 1. Crear una configuración
    // 2. Guardarla con NodeConfigRepository
    // 3. Recuperarla
    // 4. Verificar que sea idéntica
  });

  it('debe manejar la actualización de manifest correctamente', async () => {
    // Test de actualización de timestamps
  });
});
```

- [ ] Implementar test de persistencia
- [ ] Implementar test de actualización de manifest
- [ ] Verificar integridad de datos JSON

### 3. Crear pruebas de integración para la VSCode Extension

#### Test 1: Activación de la Extensión
**Archivo**: `apps/vscode/tests/integration/extension-activation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import * as vscode from 'vscode';

describe('VSCode Extension - Activation', () => {
  it('debe activar la extensión correctamente', async () => {
    const ext = vscode.extensions.getExtension('dotagents.sync');
    await ext?.activate();
    expect(ext?.isActive).toBe(true);
  });

  it('debe registrar los comandos correctamente', async () => {
    const commands = await vscode.commands.getCommands();
    expect(commands).toContain('dotagents.startSync');
    expect(commands).toContain('dotagents.stopSync');
  });
});
```

- [ ] Configurar entorno de testing de VSCode
- [ ] Implementar test de activación
- [ ] Implementar test de registro de comandos

#### Test 2: Comando de Sincronización
**Archivo**: `apps/vscode/tests/integration/sync-command.test.ts`

- [ ] Crear workspace temporal para testing
- [ ] Ejecutar comando `dotagents.startSync`
- [ ] Verificar que se cree `.agents/state.json`
- [ ] Verificar que se muestren notificaciones apropiadas

### 4. Crear pruebas end-to-end (E2E)

#### Escenario 1: Usuario nuevo activa la extensión
**Archivo**: `apps/vscode/tests/e2e/first-time-user.test.ts`

```typescript
describe('E2E - First Time User', () => {
  it('debe inicializar el proyecto automáticamente', async () => {
    // 1. Abrir workspace sin .agents/
    // 2. Activar extensión
    // 3. Verificar que se cree .agents/state.json
    // 4. Verificar que se detecten agentes del sistema
    // 5. Verificar estructura de directorios
  });
});
```

- [ ] Implementar el escenario completo
- [ ] Verificar mensajes al usuario
- [ ] Validar estructura de archivos generados

#### Escenario 2: Usuario con configuración existente
**Archivo**: `apps/vscode/tests/e2e/existing-config.test.ts`

- [ ] Crear configuración pre-existente
- [ ] Verificar que se cargue correctamente
- [ ] Validar que no se sobrescriba

#### Escenario 3: Sincronización entre múltiples agentes
**Archivo**: `apps/vscode/tests/e2e/multi-agent-sync.test.ts`

- [ ] Simular cambios desde un agente
- [ ] Verificar que se actualice el manifest
- [ ] Validar que otro agente detecte los cambios

### 5. Pruebas de regresión

#### Verificar comportamientos críticos:
- [ ] La estructura `.agents/` se crea, no `.agents/.ai/`
- [ ] El campo `agents` en el manifest es un objeto clave-valor, no un array
- [ ] Los agentes detectados son IDEs, no paquetes del proyecto
- [ ] Los timestamps se actualizan correctamente

**Archivo**: `packages/diff/tests/integration/regression.test.ts`

```typescript
describe('Regression Tests - Issue #21526', () => {
  it('NO debe crear la carpeta .agents/.ai/', async () => {
    // Verificar que no exista .agents/.ai/
  });

  it('agents debe ser un objeto, no un array', async () => {
    // Verificar estructura del manifest.agents
  });

  it('NO debe incluir packages/apps como agentes', async () => {
    // Verificar que los agentes sean solo IDEs
  });
});
```

- [ ] Implementar todas las verificaciones de regresión
- [ ] Documentar cada caso con referencia al issue original

### 6. Pruebas de rendimiento básicas

- [ ] Medir tiempo de inicialización del proyecto
- [ ] Medir tiempo de detección de agentes
- [ ] Establecer baseline de rendimiento aceptable

### 7. Documentación de testing

#### Crear guía de testing:
**Archivo**: `packages/diff/tests/README.md`

- [ ] Documentar cómo ejecutar las pruebas
- [ ] Explicar la estructura de directorios de tests
- [ ] Añadir ejemplos de cómo agregar nuevos tests
- [ ] Documentar setup y teardown de fixtures

### 8. Integración continua (CI)

#### Configurar GitHub Actions:
**Archivo**: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
      - run: bun run test:integration
```

- [ ] Crear workflow de CI
- [ ] Configurar ejecución en PRs
- [ ] Configurar cobertura de código (optional)

---

## Status

### Checklist de Estado Local

#### Configuración
- [ ] Framework de testing configurado (Vitest)
- [ ] Scripts de testing en package.json
- [ ] Configuración de CI creada

#### Tests del Paquete @dotagents/diff
- [ ] Test de inicialización de proyecto
- [ ] Test de sincronización completa
- [ ] Test de persist/recover de configuración
- [ ] Tests de regresión implementados

#### Tests de VSCode Extension
- [ ] Test de activación de extensión
- [ ] Test de comandos registrados
- [ ] Test de sincronización desde extensión

#### Tests E2E
- [ ] Escenario: Usuario nuevo
- [ ] Escenario: Configuración existente
- [ ] Escenario: Sincronización multi-agente

#### Validación Final
- [ ] Todas las pruebas pasan (100% success rate)
- [ ] Cobertura de código > 70%
- [ ] Pruebas de regresión verifican correcciones del issue #21526
- [ ] Documentación de testing completa
- [ ] CI ejecutando correctamente

**Estado Actual**: 🔵 Por hacer

---

## Notas Técnicas

### Consideraciones de Testing

#### Estructura de Directorios Recomendada
```
packages/diff/
├── src/
└── tests/
    ├── unit/           # Tests unitarios por módulo
    ├── integration/    # Tests de integración
    └── fixtures/       # Datos de prueba reutilizables

apps/vscode/
├── src/
└── tests/
    ├── integration/    # Tests de integración
    ├── e2e/            # Tests end-to-end
    └── fixtures/       # Workspaces de prueba
```

#### Mocking vs. Testing Real
- **Node filesystem**: Usar filesystem real con directorios temporales (`tmpdir()`)
- **VSCode API**: Usar mocks cuando sea posible
- **External dependencies**: Mockear para pruebas unitarias, usar reales para integración

### Criterios de Éxito del Sprint

Este sprint se considera completo cuando:
1. ✅ Todas las pruebas pasan sin errores
2. ✅ La estructura `.agents/` se genera correctamente (no `.agents/.ai/`)
3. ✅ El `state.json` tiene la estructura esperada (objeto clave-valor para agents)
4. ✅ Los agentes detectados corresponden a IDEs reales, no a paquetes del proyecto
5. ✅ El CI en GitHub Actions está verde

### Comandos de Verificación Final

```bash
# Ejecutar todos los tests
bun run test

# Ejecutar solo tests de integración
bun run test:integration

# Verificar tipos TypeScript
bun run typecheck

# Build completo
bun run build

# Verificar en la extensión de VSCode
cd apps/vscode
bun run compile
# Abrir VSCode y probar manualmente
```
