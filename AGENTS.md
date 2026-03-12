# AGENTS.md - Developer Guide for AI Coding Agents

This file provides AI coding agents with essential information about this codebase: build/test commands, code style, architecture, and conventions.

## Project Overview

**DotAgents** is a monorepo for syncing AI agent configuration directories across different IDEs, extensions, and TUIs. The `.agents/` directory serves as a **Universal Bridge** between different agent environments (e.g., `.cursor/` → `.agents/` → `.agent/`).

- **Runtime**: Bun.js (NOT Node.js, npm, or pnpm)
- **Monorepo Manager**: bunstart
- **Architecture**: Hexagonal (Ports & Adapters) with vertical slicing by feature/module
- **Language**: TypeScript exclusively

---

## Build, Lint, and Test Commands

### Root-Level Commands

```bash
# Install dependencies
bun install

# Format all files
bun run format

# Lint code
bun run lint
bun run lint:fix
```

### Package-Level Commands

Navigate to a specific package (e.g., `packages/diff` or `packages/rule`) or app (e.g., `apps/vscode`):

```bash
# Build a package
bun run build

# Watch mode for development
bun run watch
# or
bun run dev

# Run the package entry point
bun run start

# Type-check without emitting (if available)
bun run types:check
```

### Testing

**Primary test runner**: `bun test` (uses Bun's built-in test runner)  
**Some packages use**: `vitest` (e.g., `packages/diff`)

#### Running Tests

```bash
# Run all tests in a package
bun test

# Run a single test file (Bun test runner)
bun test path/to/file.test.ts

# Run tests with vitest (if package uses it)
bun run test

# Run only integration tests (vitest)
bun run test:integration

# Run a single test file with vitest
bunx vitest run path/to/file.test.ts
```

**Test file conventions**:
- Unit tests: `*.test.ts` in `tests/unit/` or alongside source files
- Integration tests: `*.test.ts` in `tests/integration/`
- Use `import { test, expect, describe, it } from 'bun:test';` for Bun tests
- Use `import { test, expect, describe, it } from 'vitest';` for vitest tests

---

## Code Style and Conventions

### General Principles

Follow **Clean Code**, **SOLID**, and **Hexagonal Architecture** principles:

1. **Meaningful Names**: Descriptive, unambiguous. Avoid abbreviations.
2. **Small, Focused Functions**: One responsibility per function.
3. **Self-Documenting Code**: Comments explain "why", not "what" or "how".
4. **DRY (Don't Repeat Yourself)**: Extract common logic.
5. **Error Handling**: Handle errors gracefully. No silent failures or empty `catch` blocks.

### SOLID Principles (in brief)

- **S**: Single Responsibility — one reason to change
- **O**: Open/Closed — open for extension, closed for modification
- **L**: Liskov Substitution — subtypes must be substitutable
- **I**: Interface Segregation — no forced dependencies on unused interfaces
- **D**: Dependency Inversion — depend on abstractions, not concretions

### Hexagonal Architecture (Ports & Adapters)

**Vertical slices** by feature/module. Each module has its own hexagonal structure:

```
src/
  modules/
    <feature-name>/
      domain/          # Entities, Value Objects, Domain Services (ZERO external deps)
      app/             # Use Cases, Ports (interfaces), DTOs, Mappers
      infra/           # Adapters (Repositories, External Clients, Controllers)
      tests/           # Unit and integration tests
  utils/             # Shared utilities across modules
  access/            # Static assets and resources
```

**Dependency Rule**: Dependencies point **inward** toward the Domain. Use dependency injection.

### TypeScript Imports

- **No `.js` extensions** in import statements
- **Type-only imports**: Use the `type` keyword

  ```typescript
  import type { MyInterface } from './path/to/module';
  import { MyClass, type MyType } from './path/to/module';
  ```

- **Use TypeScript path aliases** (defined in `tsconfig.json`) instead of relative paths:

  ```typescript
  // Good
  import { Something } from '@diff/modules/sync';
  import { AgentID } from '@rule/modules/client';

  // Bad
  import { Something } from '../../../diff/modules/sync';
  ```

### Class Constructors

**All classes must use destructured constructor props**:

```typescript
interface MyClassProps {
	dependency: SomeDependency;
	config: SomeConfig;
}

export class MyClass {
	private dependency: SomeDependency;

	constructor({ dependency, config }: MyClassProps) {
		this.dependency = dependency;
		// ...
	}
}
```

### Formatting (Prettier)

- **Tabs**: 4-space tab width, use tabs (not spaces)
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing commas**: Always
- **Line width**: 100 characters

### Error Handling

- Always handle errors explicitly
- Use domain-specific exceptions when appropriate (e.g., `ConfigExceptions`)
- Avoid empty `catch` blocks
- Return `Result` objects or DTOs that encapsulate success/failure states

---

## Bun-Specific Guidelines

**Default to Bun** instead of Node.js, npm, pnpm, vite, etc.:

- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun test` instead of `jest` or `vitest` (unless package explicitly uses vitest)
- `bun build` instead of `webpack` or `esbuild`
- `bun install` instead of `npm install`
- `bunx <package>` instead of `npx <package>`
- Bun automatically loads `.env` — **do NOT use `dotenv`**

**Bun APIs to prefer**:
- `Bun.serve()` for HTTP/WebSocket servers (don't use `express`)
- `bun:sqlite` for SQLite (don't use `better-sqlite3`)
- `Bun.file` over `node:fs` readFile/writeFile
- `WebSocket` is built-in (don't use `ws`)

---

## Documentation

### JSDoc

All methods, functions, classes, and types **should have JSDoc comments**:

```typescript
/**
 * Executes the synchronization process.
 * @param request The rules and paths for synchronization via DTO.
 */
async execute(request: SyncProjectRequestDTO): Promise<SyncResultDTO> {
	// ...
}
```

### API Documentation

- **REST APIs**: Must use **OpenAPI** for documentation
- If not explicitly requested, propose auto-documentation tools for the stack in use

---

## Testing Best Practices

1. **Organize by type**: Unit tests in `tests/unit/`, integration in `tests/integration/`
2. **Use descriptive test names**: `describe` blocks for features, `it` for specific behaviors
3. **AAA pattern**: Arrange, Act, Assert
4. **Test domain logic in isolation**: Mock infrastructure dependencies
5. **Integration tests**: Test adapters and use cases with real implementations where feasible

Example test structure (Bun test runner):

```typescript
import { describe, it, expect } from 'bun:test';

describe('MappingRule - validation', () => {
	it('throws if from or to is empty', () => {
		expect(() =>
			MappingRule.create({ from: '', to: 'y' }),
		).toThrow('Mapping source and target paths are required');
	});
});
```

---

## Key Files and Directories

- **`bunstart.config.ts`**: Monorepo configuration (apps, packages, dependencies)
- **`.cursor/rules/*.mdc`**: Cursor IDE rules (architecture, coding standards, Bun usage)
- **`packages/diff/`**: Core sync engine package
- **`packages/rule/`**: Rule management package
- **`apps/vscode/`**: VSCode extension
- **`apps/cli/`**: CLI application
- **`context/`**: Local project context persistence during development

---

## Common Pitfalls to Avoid

1. **Do NOT use Node.js commands** — always use Bun equivalents
2. **Do NOT add `.js` extensions** to TypeScript imports
3. **Do NOT violate the dependency rule** — Domain must not import from Infrastructure
4. **Do NOT use relative imports** — use TypeScript path aliases
5. **Do NOT skip JSDoc** on public methods and classes
6. **Do NOT use empty catch blocks** — handle errors explicitly

---

## Summary Checklist

- [ ] Use `bun` commands (not `node`, `npm`, `npx`)
- [ ] Follow Hexagonal Architecture (Domain, App, Infra layers)
- [ ] Use TypeScript path aliases (e.g., `@diff/*`, `@rule/*`)
- [ ] Destructure constructor props with typed interfaces
- [ ] Add JSDoc comments to public APIs
- [ ] Write tests alongside features (unit + integration)
- [ ] Run `bun run lint:fix` and `bun run format` before committing
- [ ] Use `import type` for type-only imports
- [ ] Handle errors explicitly (no silent failures)
