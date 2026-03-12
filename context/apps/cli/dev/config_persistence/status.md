# Config & Persistence Module — Sprint Plan Status

> **Módulo**: Config & Persistence (Orden #2 en el Build Order del CLI)
> **Estrategia**: TDD (RED → GREEN → REFACTOR) con Bun Test
> **Arquitectura**: Hexagonal / Slice — Sin dependencias externas de módulos

---

## Tabla de Sprints

| # | Nombre | Descripción | Status |
| - | ------ | ----------- | ------ |
| 1 | **Domain Ports & Value Objects** | Define interfaces, entities y value objects del dominio config: `ProjectConfig`, `CliPreferences`, `IConfigRepository`, `IPreferencesRepository`. | ✅ Hecho    |
| 2 | **TDD RED — YamlConfigRepository** | Escribe tests para el repositorio de configuración YAML. Cubre: lectura de config, escritura de config, manejo de errores de parseo. | 🔵 Por hacer |
| 3 | **GREEN — YamlConfigRepository** | Implementa `YamlConfigRepository` hasta que pase todos los tests del Sprint 2. Sin modificar los tests. | 🔵 Por hacer |
| 4 | **TDD RED — JsonPreferencesRepository** | Escribe tests para el repositorio de preferencias JSON. Cubre: lectura/escritura de preferencias, manejo de archivo corrupto. | 🔵 Por hacer |
| 5 | **GREEN — JsonPreferencesRepository** | Implementa `JsonPreferencesRepository` hasta que pase todos los tests del Sprint 4. | 🔵 Por hacer |
| 6 | **TDD RED — Use Cases** | Escribe tests para los casos de uso: `LoadProjectConfig`, `SaveProjectConfig`, `GetActiveAgent`. | 🔵 Por hacer |
| 7 | **GREEN — Use Cases Implementation** | Implementa los casos de uso para pasar los tests del Sprint 6. | 🔵 Por hacer |
| 8 | **Module Integration & Barrel Export** | Crea `config.module.ts` con el barrel export del módulo. Integra repositories y use cases. | 🔵 Por hacer |
| 9 | **REFACTOR & Clean Code Review** | Revisión de código, eliminación de duplicación, aplicación de naming conventions, JsDoc completo. | 🔵 Por hacer |

---

## Dependencias

- **Depende de**: Logger & Debug (✅ Completo)
- **Bloqueador de**: Agent Bridge, Orchestrator

---

## Notas

- El módulo Logger debe ser importado desde este módulo para logging interno.
- Usar `Bun.file()` para operaciones de archivo.
- No usar librerías externas de YAML — usar parsers nativos o implementar uno simple.