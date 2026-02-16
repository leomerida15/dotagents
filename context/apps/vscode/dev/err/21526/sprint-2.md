# Sprint 2: Corrección de Infraestructura - ConfigRepository

## Context
El adaptador `NodeConfigRepository` en la capa de infraestructura tiene rutas hardcodeadas que crean una subcarpeta `.ai` dentro de `.agents/`. Esto contradice el estándar del "Universal Bridge" donde la configuración debe residir directamente en `.agents/`.

**Archivos Involucrados:**
- `apps/vscode/src/mods/orchestrator/infra/NodeConfigRepository.ts`

---

## Dependencies

### Dependencias Previas
- **Sprint 1**: Debe completarse primero para que la estructura de datos del dominio esté correcta

### Sprints Dependientes
- **Sprint 5**: Las pruebas de integración dependen de que el repositorio guarde en la ubicación correcta

---

## Pasos a Ejecutar

### 1. Analizar el método `save()`
- [x] Identificar todas las referencias a la carpeta `.ai`
- [x] Documentar la estructura de directorios actual vs. esperada
- [x] Revisar las dependencias de `mkdir` y `writeFile`

### 2. Eliminar la referencia a `.ai`
```typescript
// Antes:
const aiPath = join(agentsPath, '.ai');
const syncPath = join(aiPath, this.SYNC_FILE);

// Después:
const syncPath = join(agentsPath, this.SYNC_FILE);
```
- [x] Actualizar la lógica de creación de directorios
- [x] Simplificar el flujo de guardado

### 3. Actualizar la creación de subdirectorios
```typescript
// Antes (en .ai):
await mkdir(join(aiPath, 'rules'), { recursive: true });
await mkdir(join(aiPath, 'skills'), { recursive: true });
await mkdir(join(aiPath, 'mcp'), { recursive: true });

// Después (directo en .agents):
await mkdir(join(agentsPath, 'rules'), { recursive: true });
await mkdir(join(agentsPath, 'skills'), { recursive: true });
await mkdir(join(agentsPath, 'mcp'), { recursive: true });
```
- [x] Corregir las rutas de todas las subcarpetas
- [x] Verificar permisos de escritura

### 4. Actualizar el método `load()`
- [x] Ajustar la ruta de lectura para apuntar directamente a `.agents/state.json`
- [x] Mantener la compatibilidad con el parsing JSON existente
- [x] Actualizar mensajes de error con las nuevas rutas

### 5. Actualizar el método `exists()`
- [x] Corregir la ruta de verificación
- [x] Asegurar que el método sea consistente con `load()`

### 6. Revisar el constructor
- [x] Verificar que `dotAgentsFolder = '.agents'` sea el valor por defecto correcto
- [x] Confirmar que `syncFile = 'state.json'` sea el nombre apropiado
- [x] Considerar si se debe cambiar de `state.json` a `sync.json` (se decidió mantener state.json)

### 7. Testing
- [x] Crear un directorio temporal para pruebas
- [x] Ejecutar `save()` y verificar estructura de carpetas
- [x] Ejecutar `load()` y verificar que recupere la configuración
- [x] Verificar `exists()` en escenarios positivos y negativos

---

## Status

### Checklist de Estado Local

- [x] Análisis del código actual completado
- [x] Referencias a `.ai` eliminadas
- [x] Método `save()` actualizado
- [x] Método `load()` actualizado
- [x] Método `exists()` actualizado
- [x] Subdirectorios (`rules`, `skills`, `mcp`) correctamente ubicados
- [x] Pruebas unitarias de los métodos públicos
- [x] Pruebas de integración con filesystem real
- [x] Documentación JSDoc actualizada

**Estado Actual**: 🟢 Completo

---

## Notas Técnicas

### Consideraciones Arquitecturales
- Este adaptador implementa `IConfigRepository` del dominio
- Debe seguir el principio de **Dependency Inversion**: depende de abstracciones, no de implementaciones concretas
- La lógica de negocio (dominio) no debe saber sobre rutas de archivos

### Estructura de Directorios Esperada
```
.agents/
├── state.json          # Archivo de configuración principal
├── rules/              # Reglas de sincronización
├── skills/             # Habilidades del agente
└── mcp/                # Model Context Protocol configs
```

### Posible Migración
Si existen proyectos con la estructura antigua (`.agents/.ai/state.json`), considerar:
- [ ] Script de migración opcional en un Sprint futuro
- [ ] Detección automática y advertencia al usuario
