# AGENTS.md - Developer Guide for AI Coding Agents

## Project Overview
DotAgents is a Bun.js monorepo (managed by bunstart) for syncing AI agent configurations across IDEs, extensions, and TUIs. Uses hexagonal architecture with vertical slicing. TypeScript exclusively.

## Key Commands
- `bun install` - Install dependencies
- `bun run format` - Format code
- `bun run lint` / `bun run lint:fix` - Lint code
- `bun test` - Run all tests in a package
- `bun test path/to/file.test.ts` - Run a single test file (Bun test runner)
- `bun run test` - Run tests with Vitest (if used by package)
- `bunx vitest run path/to/file.test.ts` - Run single test with Vitest

## Code Style & Conventions

### General Principles
- Follow Clean Code, SOLID, and Hexagonal Architecture
- Meaningful names, small focused functions, self-documenting code
- DRY principle, explicit error handling (no empty catch blocks)

### TypeScript
- No `.js` extensions in imports
- Type-only imports: `import type { MyInterface } from './path'`
- Use path aliases: `@diff/modules/sync` instead of relative paths
- Destructured constructor props: `constructor({ dep }: MyClassProps)`

### Formatting (Prettier)
- Tabs (4-space width), single quotes, semicolons, trailing commas
- 100-character line width

### Hexagonal Architecture
```
src/
  modules/
    <feature>/
      domain/     # Entities, Value Objects (no external deps)
      app/        # Use Cases, Ports
      infra/      # Adapters, Repositories
      tests/
```

### Documentation
- JSDoc for all public methods/functions/classes
- REST APIs require OpenAPI documentation

## Bun-Specific Guidelines
- Always use `bun` instead of `node`, `npm`, `pnpm`, `vite`
- `bun <file>` not `node <file>` or `ts-node <file>`
- `bun test` instead of Jest/Vitest (unless package uses Vitest)
- `bun build` instead of Webpack/esbuild
- Prefer `Bun.serve()`, `bun:sqlite`, `Bun.file` over Node.js equivalents
- Bun automatically loads `.env` - do not use `dotenv`

## Testing Best Practices
- Unit tests: `tests/unit/` or alongside source
- Integration tests: `tests/integration/`
- Descriptive test names: `describe` for features, `it` for behaviors
- AAA pattern: Arrange, Act, Assert
- Test domain logic in isolation (mock infrastructure)
- Integration tests with real implementations where feasible

### End-to-End (E2E) Testing
E2E tests validate the synchronization functionality between different AI agents. These tests require specific environment variables to configure the test scenario.

#### Running E2E Tests
```bash
# Run all E2E tests with a specific agent (e.g., opencode)
DOTAGENTS_E2E_AGENT=opencode bun run -b e2e/runTest.ts

# Run a specific E2E test file
DOTAGENTS_E2E_AGENT=opencode bun test apps/vscode/e2e/suite/syncSkillsToOpencode.test.ts

# Change sync direction (inbound: .agents → agent, outbound: agent → .agents)
DOTAGENTS_E2E_AGENT=opencode DOTAGENTS_E2E_SYNC_DIRECTION=inbound bun test apps/vscode/e2e/suite/syncSkillsToOpencode.test.ts
```

#### E2E Environment Variables
| Variable | Values | Description |
|----------|--------|-------------|
| `DOTAGENTS_E2E_AGENT` | `opencode`, `cursor`, `cline`, etc. | Specifies which agent to use as the target/source in E2E tests |
| `DOTAGENTS_E2E` | `1` (activates E2E mode) | Enables E2E test environment |
| `DOTAGENTS_E2E_SYNC_DIRECTION` | `inbound` (`.agents` → agent), `outbound` (agent → `.agents`) | Controls synchronization direction for testing |

#### Example E2E Test: syncSkillsToOpencode.test.ts
This test verifies that the "Sync Now" command correctly copies skills from the `.agents/` directory to the opencode agent configuration:
1. Sets `DOTAGENTS_E2E_AGENT=opencode` to target the opencode agent
2. Executes `dotagents-vscode.sync` command (inbound sync: `.agents` → IDE/agent)
3. Waits for `.agents/rules/opencode.yaml` to be created (sync completion signal)
4. Validates that `.agents/skills/` directory exists and contains skill files

## Project Structure
- `bunstart.config.ts` - Monorepo config
- `.cursor/rules/` - Cursor IDE architecture/code/Bun/SDD rules
- `packages/diff/` - Core sync engine
- `packages/rule/` - Rule management
- `apps/vscode/` - VSCode extension
- `apps/cli/` - CLI application
- `context/` - Local project context persistence

## Cursor Rules Summary
- Architecture: Vertical slices + hexagonal (domain/app/infra layers)
- Base: Monorepo with bunstart, Universal Bridge via `.agents/`
- Code: Clean Code, SOLID, hexagonal, JSDoc, destructured constructors
- Bun: Use Bun APIs, avoid Node.js/npm/Vite/Webpack
- SDD Orchestrator: Delegation-only workflow for spec-driven development

## Critical Pitfalls to Avoid
- Never use Node.js commands - always use Bun equivalents
- Never add `.js` extensions to TypeScript imports
- Never violate dependency rule (domain cannot import from infrastructure)
- Never use relative imports - use TypeScript path aliases
- Never skip JSDoc on public methods/classes
- Never use empty catch blocks - handle errors explicitly
- Never execute SDD phase work inline - always delegate to sub-agent skills
- Never treat `/sdd-ff`, `/sdd-continue`, `/sdd-new` as skills - they are orchestrator meta-commands

## Summary Checklist
- Use `bun` commands only
- Follow hexagonal architecture (domain/app/infra)
- Use TypeScript path aliases (`@diff/*`, `@rule/*`)
- Destructure constructor props with typed interfaces
- Add JSDoc comments to public APIs
- Write unit + integration tests alongside features
- Run `bun run lint:fix` and `bun run format` before committing
- Use `import type` for type-only imports
- Handle errors explicitly (no silent failures)
- Delegate all heavy work to sub-agent skills (never execute inline)
- Follow Cursor rules for architecture, code standards, and Bun usage
- Implement SDD workflow properly with delegation to sub-agents
- For E2E tests, always set appropriate environment variables (`DOTAGENTS_E2E_AGENT`, etc.)