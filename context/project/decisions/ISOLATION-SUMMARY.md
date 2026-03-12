# Resumen Ejecutivo: Aislamiento de Contexto

**Fecha**: 2026-03-08  
**Para**: Revisión rápida de decisiones sobre archivos root y contaminación de contexto

---

## ✅ BUENAS NOTICIAS: Sin Riesgo de Contaminación

### ¿Cursor lee archivos de .opencode/?
**NO** ✅

### ¿OpenCode lee archivos de .cursor/?
**NO** ✅

### ¿Hay duplicación de reglas?
**NO** ✅

**Cada agente lee SOLO su propia configuración:**

| Agente | Lee | NO Lee |
|--------|-----|---------|
| **Cursor** | `.cursor/`, `.cursorrules` | `.opencode/`, `.agent/`, `.agents/`, `AGENTS.md`, `CLAUDE.md` |
| **OpenCode** | `.opencode/`, `AGENTS.md` | `.cursor/`, `.agent/`, `.cursorrules`, `CLAUDE.md` |
| **Antigravity** | `.agent/`, `GEMINI.md` | `.cursor/`, `.opencode/`, `AGENTS.md` |
| **Claude Code** | `CLAUDE.md` | `.cursor/`, `.opencode/`, `AGENTS.md` |
| **Continue** | `.continue/` | Otros directorios |

---

## 🎯 SOLUCIÓN: Estrategia "Active Agent Only"

### Problema Original
```
proyecto/
├── AGENTS.md          ← OpenCode
├── CLAUDE.md          ← Claude Code
├── GEMINI.md          ← Gemini
├── .cursorrules       ← Cursor
├── .clinerules        ← Cline
├── .windsurfrules     ← Windsurf
└── ... 😱 6+ archivos en raíz!
```

### Solución Propuesta
```
# Cuando usas OpenCode:
proyecto/
├── AGENTS.md          ← ✅ Solo este archivo root
├── .opencode/
└── .agents/
    ├── .cache/        ← Otros archivos guardados aquí
    │   ├── CLAUDE.md
    │   ├── GEMINI.md
    │   └── .cursorrules
    └── rules/         ← Fuente de verdad
        ├── opencode-agent.md
        ├── cursor-agent.md
        └── claude-agent.md
```

### Cambiar de Agente
```bash
# Cambiar de OpenCode a Cursor
dotagents switch cursor

# Resultado:
# ✅ AGENTS.md → .agents/.cache/AGENTS.md
# ✅ .cursorrules creado desde .agents/rules/cursor-agent.md
```

```
# Después del switch:
proyecto/
├── .cursorrules       ← ✅ Ahora solo este archivo root
├── .cursor/
└── .agents/
    ├── .cache/
    │   ├── AGENTS.md  ← Guardado para restauración rápida
    │   ├── CLAUDE.md
    │   └── GEMINI.md
    └── rules/
        └── ...        ← Contenido sincronizado
```

---

## 📊 Comparación de Opciones

| Opción | Archivos Root | Ventajas | Desventajas |
|--------|---------------|----------|-------------|
| **A: Active Only** ⭐ | 1 archivo | Raíz limpia, sin confusión | Requiere switch al cambiar agente |
| **B: Todos Siempre** | 6+ archivos | No requiere switch | Raíz saturada, riesgo desincronización |
| **C: Solo Directorios** | 0 archivos | Raíz ultra-limpia | No funciona con agentes que requieren archivo root |

**Recomendación:** ⭐ **Opción A** - Active Only

---

## 🔧 Implementación Técnica

### 1. Nuevo Campo en Mapping Rules

```yaml
# rules/opencode.yaml
mapping:
  inbound:
    - from: "AGENTS.md"
      to: "rules/opencode-agent.md"
      format: "file"
      condition: "active_agent_only"  # ← NUEVO

  outbound:
    - from: "rules/opencode-agent.md"
      to: "AGENTS.md"
      format: "file"
      condition: "active_agent_only"  # ← NUEVO
```

### 2. Configuración de Agente Activo

```json
// .agents/config.json
{
    "activeAgent": "opencode",
    "rootFileStrategy": "active_only",
    "cleanupInactive": true
}
```

### 3. Estructura de Caché

```
.agents/
├── .cache/              ← Archivos root inactivos
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── GEMINI.md
│   ├── .cursorrules
│   └── .clinerules
├── rules/               ← Fuente de verdad
│   ├── opencode-agent.md
│   ├── cursor-agent.md
│   ├── claude-agent.md
│   └── gemini-agent.md
└── config.json
```

---

## ✅ Checklist de Implementación

### Fase 1: Schema
- [ ] Añadir campo `condition` a `MappingRule`
- [ ] Actualizar `MappingRuleDTO` y mappers
- [ ] Añadir tipos: `'always' | 'active_agent_only' | 'manual'`

### Fase 2: Lógica de Sync
- [ ] Modificar `SyncProjectUseCase` para evaluar `condition`
- [ ] Implementar `shouldProcessForActiveAgent()`
- [ ] Añadir parámetro `activeAgentId` a `SyncProjectRequestDTO`

### Fase 3: Gestión de Archivos
- [ ] Crear `.agents/.cache/` directory
- [ ] Implementar `cleanInactiveAgentFiles()`
- [ ] Implementar `restoreFromCache()`
- [ ] Añadir comando `dotagents switch <agent>`

### Fase 4: Config
- [ ] Añadir `activeAgent` a `.agents/config.json`
- [ ] Añadir `rootFileStrategy` option
- [ ] Auto-detectar agente activo en `FsAgentScanner`

### Fase 5: YAML Rules
- [ ] Actualizar `rules/opencode.yaml` con `condition`
- [ ] Actualizar `rules/cursor.yaml` con `condition`
- [ ] Crear `rules/claude-code.yaml` con `condition`
- [ ] Crear `rules/gemini.yaml` (Antigravity) con `condition`

### Fase 6: Testing
- [ ] Test: Solo agente activo tiene archivo root
- [ ] Test: Switching preserva contenido
- [ ] Test: Caché restaura archivos correctamente
- [ ] Test: Sin contaminación de contexto

---

## 📚 Documentos Relacionados

1. **CONTEXT-ISOLATION-STRATEGY.md** - Estrategia completa y detallada
2. **AGENTS-MD-STRATEGY.md** - Estrategia original de AGENTS.md
3. **opencode-agent-file-update.md** - Implementación específica de OpenCode

---

## 🎯 Respuestas Directas a Tus Preguntas

### 1. "¿Cómo sabemos que Cursor no lee archivos de .opencode y obtiene las reglas por duplicado?"

✅ **Confirmado:**
- Cursor **SOLO lee** `.cursor/` y `.cursorrules`
- **Ignora completamente** `.opencode/`, `.agent/`, `.agents/`, `AGENTS.md`
- Cada agente tiene **convenciones de naming únicas** que previenen conflictos
- **FsAgentScanner** detecta agentes por markers específicos, no hay solapamiento

### 2. "¿Cómo podemos sincronizar AGENTS.md sin tener un exceso de archivos en nuestra raíz?"

✅ **Solución: Estrategia "Active Agent Only"**

**Antes (problema):**
```
proyecto/
├── AGENTS.md
├── CLAUDE.md
├── GEMINI.md
├── .cursorrules
├── .clinerules
└── .windsurfrules  ← 6 archivos! 😱
```

**Después (solución):**
```
proyecto/
└── AGENTS.md       ← Solo 1 archivo (del agente activo) ✅

# Los demás están en:
.agents/.cache/
├── CLAUDE.md
├── GEMINI.md
└── .cursorrules
```

**Cómo funciona:**
1. Solo el agente activo tiene su archivo root
2. Al cambiar de agente: `dotagents switch cursor`
3. Automáticamente mueve archivos a/desde `.agents/.cache/`
4. `.agents/rules/` mantiene fuente de verdad para todos

---

## 🚀 Siguiente Paso

**Decisión requerida:**

¿Quieres que implemente la estrategia "Active Agent Only"?

- [ ] Sí, implementar Fase 1-3 (schema, lógica, gestión de archivos)
- [ ] Sí, pero empezar solo con Fase 1-2 (sin gestión de caché aún)
- [ ] No, prefiero revisar más opciones
- [ ] No, voy a implementarlo yo mismo usando esta documentación

**Si eliges implementar, los próximos pasos serían:**
1. Actualizar `MappingRule.ts` con campo `condition`
2. Modificar `SyncProjectUseCase.ts` para evaluar condiciones
3. Actualizar `rules/opencode.yaml` con mappings condicionales
