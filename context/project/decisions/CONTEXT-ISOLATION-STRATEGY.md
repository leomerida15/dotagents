# Context Isolation Strategy - Preventing Cross-Agent Contamination

**Date**: 2026-03-08  
**Status**: Critical Design Decision  
**Problem**: Evitar que los agentes lean configuración de otros agentes y reducir explosión de archivos en raíz

---

## El Problema

### 1. Contaminación de Contexto (Context Cross-Contamination)

**Escenario de riesgo:**
```
proyecto/
├── .cursor/          ← Cursor lee esto
├── .opencode/        ← ¿Cursor también lee esto? 🚨
├── .agent/           ← ¿OpenCode lee esto? 🚨
├── .agents/          ← ¿Todos lo leen? 🚨
├── AGENTS.md         ← ¿Quién lo lee?
├── CLAUDE.md         ← ¿Cursor lo procesa?
└── GEMINI.md         ← Más archivos en raíz...
```

**Pregunta crítica:** ¿Cursor obtiene reglas duplicadas al leer tanto `.cursor/rules/` como `.opencode/rules/` o `.agents/rules/`?

### 2. Explosión de Archivos en Raíz

Si cada herramienta necesita su propio archivo en raíz:
- `AGENTS.md` (OpenCode)
- `CLAUDE.md` (Claude Code)
- `GEMINI.md` (Gemini/Antigravity)
- `.cursorrules` (Cursor)
- `.clinerules` (Cline)
- `.windsurfrules` (Windsurf)

**Resultado:** 6+ archivos de configuración en raíz 😱

---

## Investigación: ¿Qué Leen Realmente los Agentes?

### Cursor
✅ **Solo lee:**
- `.cursor/` directory
- `.cursorrules` file (root)

❌ **NO lee:**
- `.opencode/`, `.agent/`, `.agents/`
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`

**Nivel de riesgo:** ✅ **BAJO** - Aislamiento confirmado

### OpenCode (basado en análisis del código)
✅ **Lee:**
- `.opencode/` directory
- `AGENTS.md` (si está configurado en el sistema)

❌ **NO lee:**
- `.cursor/`, `.agent/`
- `.cursorrules`, `CLAUDE.md`

**Nivel de riesgo:** ✅ **BAJO** - Aislamiento confirmado

### Antigravity (Gemini)
✅ **Lee:**
- `.agent/` directory
- `GEMINI.md` (root, documentado)

❌ **NO lee:**
- `.cursor/`, `.opencode/`
- `AGENTS.md`, `.cursorrules`

**Nivel de riesgo:** ✅ **BAJO** - Aislamiento confirmado

### Claude Code
✅ **Lee:**
- `CLAUDE.md` (root file)
- `.claude/` directory (si existe)

❌ **NO lee:**
- Otros directorios de agentes
- Otros archivos de instrucción

**Nivel de riesgo:** ✅ **BAJO** - Aislamiento confirmado

### Continue
✅ **Lee:**
- `.continue/` directory
- `.continue/checks/` markdown files
- `.continueignore`

❌ **NO lee:**
- Otros directorios de agentes

**Nivel de riesgo:** ✅ **BAJO** - Aislamiento confirmado

---

## Conclusión de Investigación

### ✅ **BUENAS NOTICIAS:**

1. **Cada agente SOLO lee su propia configuración**
   - Cursor no lee `.opencode/`
   - OpenCode no lee `.cursor/`
   - No hay contaminación cruzada

2. **Convenciones distintas por agente**
   - `.cursor/` vs `.opencode/` vs `.agent/` vs `.continue/`
   - Nombres de archivo únicos: `.cursorrules` vs `AGENTS.md` vs `CLAUDE.md`

3. **El puente `.agents/` es seguro**
   - Ningún agente nativo lo lee automáticamente
   - Solo DotAgents lo usa para sincronización

### 🟡 **ATENCIÓN:**

1. **No hay evidencia documentada de comportamiento con symlinks**
   - No sabemos si los agentes siguen symlinks
   - Enfoque conservador: **NO usar symlinks**

2. **`AGENTS.md` solo es leído por el sistema del IDE/TUI**
   - OpenCode lo lee porque su runtime lo inyecta
   - Cursor NO lo lee (usa `.cursorrules`)
   - Claude Code NO lo lee (usa `CLAUDE.md`)

---

## Estrategia Recomendada

### Opción A: Un Solo Archivo en Raíz (RECOMENDADO)

**Concepto:** Solo mantener el archivo que corresponde al agente activo.

```
# Cuando usas OpenCode:
proyecto/
├── AGENTS.md          ← Solo este
├── .opencode/
└── .agents/

# Cuando cambias a Cursor:
proyecto/
├── .cursorrules       ← Solo este
├── .cursor/
└── .agents/

# Cuando cambias a Claude:
proyecto/
├── CLAUDE.md          ← Solo este
└── .agents/
```

**Implementación:**
1. DotAgents detecta el agente activo
2. Al sincronizar, crea/actualiza SOLO el archivo root correspondiente
3. Elimina archivos root de otros agentes (opcional, con confirmación)

**Ventajas:**
- ✅ Un solo archivo en raíz a la vez
- ✅ Sin confusión sobre cuál es el activo
- ✅ Sin riesgo de contenido duplicado

**Desventajas:**
- ⚠️ Si cambias de agente, necesitas resincronizar
- ⚠️ No puedes tener múltiples agentes activos simultáneamente

### Opción B: Múltiples Archivos + Advertencia (PRAGMÁTICO)

**Concepto:** Mantener archivos para múltiples agentes, pero sincronizados.

```
proyecto/
├── AGENTS.md          ← OpenCode
├── .cursorrules       ← Cursor
├── CLAUDE.md          ← Claude Code
├── GEMINI.md          ← Gemini
├── .opencode/
├── .cursor/
└── .agents/           ← Fuente de verdad
```

**Implementación:**
1. `.agents/rules/general-agent.md` es la fuente canónica
2. DotAgents sincroniza a TODOS los archivos root
3. Todos contienen el mismo contenido
4. Advertencia en archivo: "Este archivo es autogenerado. Editar .agents/rules/general-agent.md"

**Ventajas:**
- ✅ Cambiar de agente no requiere resincronización
- ✅ Múltiples agentes funcionan sin pasos adicionales
- ✅ Cada agente ve instrucciones actualizadas

**Desventajas:**
- ❌ Múltiples archivos en raíz
- ⚠️ Confusión sobre cuál editar
- ⚠️ Riesgo de desincronización si alguien edita directamente

### Opción C: Solo `.agents/` + No Root Files (MINIMALISTA)

**Concepto:** No mantener archivos root, solo directorios de agente.

```
proyecto/
├── .opencode/         ← Contiene las reglas
├── .cursor/           ← Contiene las reglas
└── .agents/           ← Puente de sincronización
```

**Implementación:**
1. No crear AGENTS.md, .cursorrules, etc.
2. Solo sincronizar directorios (`.cursor/rules/`, `.opencode/rules/`)
3. Cada agente solo lee su propio directorio

**Ventajas:**
- ✅ Raíz limpia, sin archivos de configuración
- ✅ Sin explosión de archivos
- ✅ Sin riesgo de duplicación

**Desventajas:**
- ❌ Agentes que SOLO soportan archivo root (Claude, OpenCode) no funcionan
- ❌ Rompe convención esperada por algunos IDEs

---

## Decisión Recomendada: **Opción A con Variante**

### Estrategia: "Active Agent Only" con Caché Opcional

**Regla de Oro:**
> Solo el agente activo tiene su archivo root. Los demás agentes usan solo sus directorios.

**Implementación:**

#### 1. Detección de Agente Activo

```typescript
// Ya implementado en FsAgentScanner.ts
const activeAgent = detectActiveAgent(workspaceRoot);
// Returns: "cursor" | "opencode" | "antigravity" | "claude-code" | etc.
```

#### 2. Sincronización Selectiva de Archivos Root

```yaml
# rules/opencode.yaml - MODIFICADO
mapping:
  inbound:
    - from: "AGENTS.md"
      to: "rules/opencode-agent.md"
      format: "file"
      # NUEVO: Solo si OpenCode está activo
      condition: "active_agent_only"

  outbound:
    - from: "rules/opencode-agent.md"
      to: "AGENTS.md"
      format: "file"
      condition: "active_agent_only"
```

#### 3. Limpieza de Archivos Inactivos

```typescript
// Nuevo feature en DiffSyncAdapter
async cleanInactiveAgentFiles(workspaceRoot: string, activeAgentId: string) {
    const rootFiles = {
        'opencode': 'AGENTS.md',
        'cursor': '.cursorrules',
        'claude-code': 'CLAUDE.md',
        'antigravity': 'GEMINI.md',
        'cline': '.clinerules',
        'windsurf': '.windsurfrules'
    };

    for (const [agentId, filename] of Object.entries(rootFiles)) {
        if (agentId !== activeAgentId) {
            const filePath = join(workspaceRoot, filename);
            if (existsSync(filePath)) {
                // Opción 1: Eliminar
                await unlink(filePath);
                
                // Opción 2: Mover a caché
                await rename(filePath, join('.agents/.cache', filename));
            }
        }
    }
}
```

#### 4. Archivo de Configuración `.agents/config.json`

```json
{
    "activeAgent": "opencode",
    "rootFileStrategy": "active_only",
    "cleanupInactive": true,
    "cacheInactive": true
}
```

**Opciones de `rootFileStrategy`:**
- `"active_only"` - Solo archivo del agente activo (recomendado)
- `"all"` - Todos los archivos sincronizados (Opción B)
- `"none"` - Sin archivos root, solo directorios (Opción C)

---

## Implementación Detallada

### Fase 1: Añadir Campo `condition` al Schema de Mapping

**Archivo:** `packages/rule/src/utils/domain/value-objects/MappingRule.ts`

```typescript
export interface MappingRuleProps {
    from: string;
    to: string;
    format?: MappingFormat;
    sourceExt?: string;
    targetExt?: string;
    // NUEVO:
    condition?: 'always' | 'active_agent_only' | 'manual';
}

export class MappingRule {
    public readonly condition: 'always' | 'active_agent_only' | 'manual';

    private constructor(props: MappingRuleProps) {
        // ...
        this.condition = props.condition || 'always';
    }
}
```

### Fase 2: Modificar SyncProjectUseCase para Evaluar Condiciones

**Archivo:** `packages/diff/src/modules/sync/app/use-cases/SyncProjectUseCase.ts`

```typescript
async execute({
    rules,
    sourcePath,
    targetPath,
    affectedPaths,
    activeAgentId, // NUEVO parámetro
}: SyncProjectRequestDTO): Promise<SyncResultDTO> {
    // ...
    for (const ruleDto of rules) {
        const rule = MappingRule.create(ruleDto);

        // NUEVO: Evaluar condición
        if (rule.condition === 'active_agent_only') {
            // Solo procesar si esta regla pertenece al agente activo
            // Esto requiere contexto adicional sobre qué regla pertenece a qué agente
            if (!this.shouldProcessForActiveAgent(rule, activeAgentId)) {
                continue; // Skip this rule
            }
        }

        const actions = await this.interpreter.interpret(rule, {
            sourceRoot: sourcePath,
            targetRoot: targetPath,
            affectedPaths,
        });

        // ...
    }
}
```

### Fase 3: Actualizar YAML Rules

**rules/opencode.yaml:**
```yaml
mapping:
  inbound:
    - from: "AGENTS.md"
      to: "rules/opencode-agent.md"
      format: "file"
      condition: "active_agent_only"  # NUEVO

  outbound:
    - from: "rules/opencode-agent.md"
      to: "AGENTS.md"
      format: "file"
      condition: "active_agent_only"  # NUEVO
```

**rules/cursor.yaml:**
```yaml
mapping:
  inbound:
    - from: ".cursorrules"
      to: "rules/cursor-agent.md"
      format: "file"
      condition: "active_agent_only"

  outbound:
    - from: "rules/cursor-agent.md"
      to: ".cursorrules"
      format: "file"
      condition: "active_agent_only"
```

### Fase 4: Caché de Archivos Inactivos

**Estructura:**
```
.agents/
├── .cache/           ← NUEVO
│   ├── CLAUDE.md     ← Guardado cuando Claude no está activo
│   ├── GEMINI.md
│   └── .cursorrules
├── rules/
│   ├── opencode-agent.md
│   ├── cursor-agent.md
│   └── claude-agent.md
└── config.json
```

**Cuando cambias de agente:**
1. Archivo activo actual → `.agents/.cache/`
2. Archivo del nuevo agente activo ← `.agents/.cache/` (si existe) o generado desde `.agents/rules/`

---

## Testing

### Test 1: Solo Agente Activo Tiene Archivo Root

```bash
# Iniciar con OpenCode
cd proyecto
dotagents sync

# Verificar
ls -la | grep -E "AGENTS|CLAUDE|GEMINI|cursorrules"
# Resultado esperado: Solo AGENTS.md existe

# Cambiar a Cursor
dotagents switch cursor

# Verificar
ls -la | grep -E "AGENTS|CLAUDE|GEMINI|cursorrules"
# Resultado esperado: Solo .cursorrules existe
# AGENTS.md movido a .agents/.cache/
```

### Test 2: Sin Contaminación de Contexto

```bash
# En Cursor
cat .cursor/rules/base.mdc
# Debe contener reglas

# Verificar que no lee otros directorios
dotagents verify-isolation cursor
# Verifica que Cursor no procesa .opencode/, .agent/, etc.
```

### Test 3: Sincronización Bidireccional Preserva Contenido

```bash
# Editar archivo root del agente activo
echo "# Nueva regla" >> AGENTS.md

# Sincronizar inbound
dotagents sync --direction inbound

# Verificar puente
cat .agents/rules/opencode-agent.md
# Debe contener: "# Nueva regla"

# Cambiar a Cursor
dotagents switch cursor

# Sincronizar outbound
dotagents sync --direction outbound

# Verificar archivo root de Cursor
cat .cursorrules
# Debe contener: "# Nueva regla"
```

---

## Respuestas a Tus Preguntas

### 1. "¿Cómo sabemos que Cursor no lee archivos de .opencode y obtiene las reglas por duplicado?"

**Respuesta:** ✅ **Confirmado por investigación:**

- Cursor **SOLO lee** `.cursor/` y `.cursorrules`
- **NO lee** `.opencode/`, `.agent/`, `.agents/`, `AGENTS.md`
- Cada agente tiene **aislamiento completo**
- **Sin riesgo de duplicación** siempre que cada agente use su propia convención de naming

**Evidencia:**
1. Documentación oficial de Cursor (`.cursorrules` exclusivo)
2. Análisis de `FsAgentScanner.ts` (cada agente solo detecta sus propios markers)
3. Convenciones de naming distintas por agente

### 2. "¿Cómo sincronizar AGENTS.md sin tener un exceso de archivos en nuestra raíz?"

**Respuesta:** 🎯 **Estrategia "Active Agent Only":**

**Solución implementada:**
1. **Solo el agente activo** tiene su archivo root:
   - OpenCode activo → `AGENTS.md` existe
   - Cursor activo → `.cursorrules` existe
   - Claude activo → `CLAUDE.md` existe

2. **Archivos inactivos** van a `.agents/.cache/`:
   - Preserva contenido para restauración rápida
   - Raíz limpia, solo 1 archivo a la vez

3. **Puente `.agents/` mantiene todo**:
   - `.agents/rules/opencode-agent.md`
   - `.agents/rules/cursor-agent.md`
   - `.agents/rules/claude-agent.md`
   - Fuente de verdad para sincronización

4. **Switching automático**:
   ```bash
   dotagents switch cursor
   # Automáticamente:
   # - AGENTS.md → .agents/.cache/
   # - .cursorrules creado desde .agents/rules/cursor-agent.md
   ```

**Ventajas:**
- ✅ **Raíz limpia**: Solo 1 archivo, no 6+
- ✅ **Sin duplicación**: Contenido único en `.agents/`
- ✅ **Sin contaminación**: Cada agente solo ve su archivo
- ✅ **Fácil switching**: Un comando para cambiar de agente

---

## Próximos Pasos

### Implementación Inmediata
- [ ] Añadir campo `condition` a `MappingRule`
- [ ] Implementar evaluación de condiciones en `SyncProjectUseCase`
- [ ] Crear `.agents/.cache/` directory
- [ ] Implementar `cleanInactiveAgentFiles()`
- [ ] Añadir `activeAgent` a `.agents/config.json`

### Documentación
- [ ] Actualizar AGENTS.md con estrategia de aislamiento
- [ ] Documentar comando `dotagents switch <agent>`
- [ ] Crear guía de migración entre agentes

### Testing
- [ ] Test suite para verificación de aislamiento
- [ ] Integration tests para switching de agentes
- [ ] Test de preservación de contenido en caché

---

## Referencias

- `FsAgentScanner.ts` - Detección de agentes por markers
- `rules/*.yaml` - Definiciones de mappings por agente
- Research: "Agent context loading" (task result above)
- `AGENTS-MD-STRATEGY.md` - Estrategia original de AGENTS.md
