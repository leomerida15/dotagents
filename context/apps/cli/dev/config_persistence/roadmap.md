# Config & Persistence Module — Roadmap

> **Módulo**: Config & Persistence (Orden #2 en el Build Order del CLI)
> **Dependencia**: Logger & Debug (✅ Completo)
> **Arquitectura**: Hexagonal / Slice — Sin dependencias externas de módulos

---

## Objetivo del Módulo

Manejar la configuración del proyecto y las preferencias del CLI:
- Cargar/guardar configuración del proyecto `.agents/config.yaml`
- Gestionar preferencias del CLI (agente activo, paths, etc.)
- Persistir estado del proyecto entre sesiones
- Proporcionar repositorios para otros módulos

---

## Componentes

### Domain Layer
- **Value Objects**: `ProjectPath`, `AgentId`, `ConfigPath`
- **Entities**: `ProjectConfig`, `CliPreferences`
- **Ports (Interfaces)**: `IConfigRepository`, `IPreferencesRepository`

### Infrastructure Layer
- **Adapters**: `YamlConfigRepository`, `JsonPreferencesRepository`
- **File Handlers**: Lectura/escritura de archivos YAML/JSON

### Application Layer
- **Use Cases**: `LoadProjectConfig`, `SaveProjectConfig`, `GetActiveAgent`

---

## Estructura de Directorios

```
apps/cli/src/modules/config/
├── domain/
│   ├── project-config.entity.ts
│   ├── cli-preferences.entity.ts
│   ├── project-path.vo.ts
│   ├── agent-id.vo.ts
│   ├── config-path.vo.ts
│   ├── config-repository.port.ts
│   └── preferences-repository.port.ts
├── infrastructure/
│   ├── yaml-config-repository.ts
│   ├── json-preferences-repository.ts
│   └── file-handler.ts
├── application/
│   ├── load-project-config.use-case.ts
│   ├── save-project-config.use-case.ts
│   └── get-active-agent.use-case.ts
├── __tests__/
│   ├── project-config.entity.test.ts
│   ├── cli-preferences.entity.test.ts
│   ├── yaml-config-repository.test.ts
│   └── json-preferences-repository.test.ts
├── index.ts
└── config.module.ts
```

---

## Sprints

| # | Nombre | Descripción | Dependencia |
| - | ------ | ----------- | ----------- |
| 1 | **Domain Ports & Value Objects** | Define interfaces, entities y value objects del dominio config. | None |
| 2 | **TDD RED — YamlConfigRepository** | Escribe tests para el repositorio de configuración YAML. | Sprint 1 |
| 3 | **GREEN — YamlConfigRepository** | Implementa el repositorio YAML para pasar los tests. | Sprint 2 |
| 4 | **TDD RED — JsonPreferencesRepository** | Escribe tests para el repositorio de preferencias JSON. | Sprint 1 |
| 5 | **GREEN — JsonPreferencesRepository** | Implementa el repositorio JSON para pasar los tests. | Sprint 4 |
| 6 | **TDD RED — Use Cases** | Escribe tests para los casos de uso de aplicación. | Sprint 3, 5 |
| 7 | **GREEN — Use Cases Implementation** | Implementa los casos de uso. | Sprint 6 |
| 8 | **Module Integration & Barrel Export** | Crea el módulo con barrel export y factory. | Sprint 7 |
| 9 | **REFACTOR & Clean Code Review** | Revisión de código, DRY, SOLID, JsDoc completo. | Sprint 8 |

---

## Dependencias Externas

Este módulo NO introduce dependencias npm externas. Usa:
- `Bun.file()` para lectura/escritura de archivos
- APIs nativas de Node.js (`fs`, `path`)
- Logger del módulo anterior para logging

---

## Entregables

Al finalizar este módulo, el CLI podrá:
1. Leer configuración del proyecto desde `.agents/config.yaml`
2. Guardar preferencias del CLI en `~/.dotagents/preferences.json`
3. Gestionar el agente activo y sus paths
4. Proporcionar configuración a los módulos: Agent Bridge, Orchestrator, TUI

---

## Próximos Pasos

1. Crear `sprint-01-domain-ports.md`
2. Definir interfaces `IConfigRepository` y `IPreferencesRepository`
3. Crear entities `ProjectConfig` y `CliPreferences`
4. Crear value objects `ProjectPath`, `AgentId`, `ConfigPath`