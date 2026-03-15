---
description: Workspace-specific architectural and coding standards.
alwaysApply: false
---

# Workspace Rules

This file defines the context and standards for this specific workspace.

## 1. Directory Structure and Architecture

The project structure is based on the pattern established in `packages/diff/src`. All packages and applications must adhere to the following directory layout:

- `src/`: Root directory for all source code.
- `src/modules/`: Contains separate modules, each implemented using its own local Hexagonal Architecture (Domain, Application, Infrastructure).
- `src/utils/`: Shared utilities and helper functions used across multiple modules.
- `src/access/`: Static assets and resources.
- `dist/`: Output directory for compiled and packaged code.

## 2. TypeScript Alias Paths

To maintain clean and manageable imports, we use TypeScript path aliases:

- Every package (`pkg`) and application (`app`) must have a corresponding alias path defined in the root `tsconfig.json`.
- **Mandatory Usage**: When writing or refactoring code, you MUST use TypeScript aliases (e.g., `@diff/*`, `@rule/*`, `@config/*`) instead of relative paths or literal local imports whenever possible.
