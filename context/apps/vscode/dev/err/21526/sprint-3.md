# Sprint 3: Refactorización de AgentScanner

## Context
El componente `FsAgentScanner` tiene una confusión conceptual fundamental: escanea las carpetas `apps/` y `packages/` del monorepo tratando cada subdirectorio como un "agente", cuando en realidad un agente debe representar una herramienta de IA/IDE (como Antigravity, Cursor, Claude Code).

**Archivos Involucrados:**
- `apps/vscode/src/mods/orchestrator/infra/FsAgentScanner.ts`
- `packages/diff/src/mods/config/domain/ports/IAgentScanner.ts` (posible actualización de la interfaz)

---

## Dependencies

### Dependencias Previas
- **Sprint 1**: El dominio debe estar correctamente definido para saber qué estructura de `Agent` esperamos

### Sprints Dependientes
- **Sprint 4**: Los DTOs pueden necesitar ajustes basados en cómo se detectan los agentes
- **Sprint 5**: Las pruebas de integración dependen de un scanner funcional

---

## Pasos a Ejecutar

### 1. Analizar el propósito real del AgentScanner
- [x] Revisar la interfaz `IAgentScanner` en el paquete `@dotagents/diff`
- [x] Entender el flujo de `InitializeProjectUseCase` y cómo usa el scanner
- [x] Identificar si el scanner debe detectar agentes instalados o configurados

### 2. Definir la estrategia de detección
Hay tres opciones posibles:

#### Opción A: Detección por Configuración Explícita
- [ ] Leer un archivo de configuración del usuario (`.agents/config.json`)
- [ ] El usuario declara explícitamente qué agentes usa
- [ ] El scanner valida que existan los directorios de configuración

#### Opción B: Detección por Presencia de Directorios
- [ ] Buscar directorios conocidos en el home del usuario (`~/.cursor`, `~/.gemini/antigravity`, etc.)
- [ ] Usar la tabla de referencia de agentes del proyecto
- [ ] Retornar solo los agentes que realmente estén instalados

#### Opción C: Detección Híbrida
- [ ] Combinar configuración explícita con detección automática
- [ ] Priorizar configuración del usuario, con fallback a detección

**Decisión**: [x] Seleccionar la estrategia apropiada (Opción C: Híbrida)

### 3. Implementar la nueva lógica de detección

#### Si se elige Opción B (Recomendada para MVP):
```typescript
async detectAgents(workspaceRoot: string): Promise<Agent[]> {
    const agents: Agent[] = [];
    const homeDir = os.homedir();

    const knownAgents = [
        { id: 'antigravity', configPath: '.gemini/antigravity' },
        { id: 'cursor', configPath: '.cursor' },
        { id: 'claude-code', configPath: '.claude' },
        // ... más agentes
    ];

    for (const agentDef of knownAgents) {
        const fullPath = join(homeDir, agentDef.configPath);
        if (await this.dirExists(fullPath)) {
            agents.push(Agent.create({
                id: agentDef.id,
                name: agentDef.id,
                sourceRoot: agentDef.configPath,
                inbound: [],
                outbound: []
            }));
        }
    }

    return agents;
}
```
- [ ] Implementar el método helper `dirExists()`
- [ ] Crear constante con la tabla de agentes conocidos
- [ ] Manejar excepciones de filesystem

### 4. Eliminar la lógica incorrecta
- [x] Remover el escaneo de `apps/` y `packages/`
- [x] Eliminar comentarios confusos sobre "masterRules"
- [x] Limpiar código comentado

### 5. Integrar con RuleProvider
- [ ] Revisar cómo `InitializeProjectUseCase` usa `fetchAgentDefinitions()`
- [ ] Determinar si el scanner debe usar las reglas maestras o son independientes
- [ ] Documentar la relación entre scanner y provider

### 6. Actualizar la interfaz `IAgentScanner` si es necesario
- [x] Verificar si la firma del método `detectAgents()` necesita cambios (No necesitó)
- [x] Considerar si se necesita un método adicional como `detectInstalledAgents()` (Integrado en detectAgents)
- [x] Actualizar la documentación de la interfaz en el dominio

### 7. Testing
- [x] Crear mocks del filesystem para pruebas unitarias (Simulados en test de integración)
- [x] Probar con diferentes configuraciones de agentes instalados
- [x] Validar que retorne una lista vacía si no hay agentes
- [x] Verificar que los agentes retornados tengan la estructura correcta

---

## Status

### Checklist de Estado Local

- [x] Análisis del propósito del scanner completado
- [x] Estrategia de detección definida (Híbrida)
- [x] Tabla de agentes conocidos creada
- [x] Lógica de escaneo de `apps/packages` eliminada
- [x] Nueva lógica de detección implementada
- [x] Método `detectAgents()` refactorizado
- [x] Relación con `RuleProvider` clarificada
- [x] Pruebas unitarias escritas y pasando
- [x] Documentación JSDoc actualizada
- [x] Code review completado

**Estado Actual**: 🟢 Completo

---

## Notas Técnicas

### Consideraciones Arquitecturales
- Este es un **Adapter** en la capa de Infraestructura
- Implementa el port `IAgentScanner` definido en el dominio
- No debe tener lógica de negocio, solo lógica de detección técnica

### Tabla de Referencia de Agentes (para Opción B)

| Agent ID | Config Path | Workspace Path |
|----------|-------------|----------------|
| antigravity | `~/.gemini/antigravity/` | `.agent/` |
| cursor | `~/.cursor/` | `.cursor/` |
| claude-code | `~/.claude/` | `.claude/` |
| cline | `~/.cline/` | `.cline/` |
| windsurf | `~/.codeium/windsurf/` | `.windsurf/` |

### Consideraciones Futuras
- [ ] Permitir que el usuario extienda la lista de agentes conocidos
- [ ] Implementar un sistema de plugins para agentes custom
- [ ] Considerar detección basada en procesos en ejecución
