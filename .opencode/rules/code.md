---
trigger: always_on
---

# General Coding Standards

All code generated or refactored must strictly adhere to the following principles to ensure maintainability, scalability, and testability.

## 1. Clean Code Principles
- **Meaningful Names**: Use descriptive and unambiguous names for variables, functions, and classes. Avoid abbreviations.
- **Small Functions**: Functions should do one thing and do it well. Keep them short and focused.
- **Comments**: Code should be self-documenting. Use comments *only* to explain the "why", not the "what" or "how".
- **DRY (Don't Repeat Yourself)**: Avoid code duplication. Extract common logic into reusable functions or components.
- **Consistent Formatting**: Follow the project's existing style guide or standard language conventions (e.g., Prettier/ESLint for JS/TS).
- **Error Handling**: Handle errors gracefully. Avoid silent failures or empty catch blocks.

## 2. SOLID Principles
- **S - Single Responsibility Principle (SRP)**: A class or module should have one, and only one, reason to change.
- **O - Open/Closed Principle (OCP)**: Software entities should be open for extension but closed for modification.
- **L - Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types without altering the correctness of the program.
- **I - Interface Segregation Principle (ISP)**: Clients should not be forced to depend on interfaces they do not use. Split large interfaces into smaller, specific ones.
- **D - Dependency Inversion Principle (DIP)**: High-level modules should not depend on low-level modules. Both should depend on abstractions.

## 3. Hexagonal Architecture (Ports and Adapters) - Slice Architecture
- **Domain Centric**: The core business logic (Domain) must remain independent of external frameworks, databases, or UI.
- **Dependency Rule**: Dependencies must point *inwards* towards the Domain. Use dependency injection to invert control.
- **Vertical Slices (Modular)**: The project is structured by modules or features (slices). Each module MUST have its own internal hexagonal structure to ensure isolation and clear boundaries:
  - **Domain**: Entities, Value Objects, and Domain Services specific to the module. Zero external dependencies.
  - **Application**: Use Cases / Interactors that orchestrate domain logic for the module.
  - **Infrastructure/Adapters**: Implementations for I/O (Repositories, External Clients, Controllers) for the module.
- **Module Integration**: Modules interact via Application Services or Domain events. Avoid direct coupling between internal layers of different modules.
- **Ports**: Define interfaces (Ports) in the Domain/Application layer that the Infrastructure layer must implement (Adapters).


## 4. Documentacion legible.
- **API REST - OpenAPI**: toda api rest construida debe tener documetnacion con OpenAPI si ves que no se solicita explicitamente al iniciar el proyecto, investiga como integrar una forma de auto documentacion con la herramienta que se este usando para la contruccion de una API REST y plantea al usuario.
- **JsDoc - cometnarios refenciales**: todos los metodos, funciones, clases y tipados posiblen deben cumplir con documentacion usdano JsDoc.

## 5. Class Properties and Constructors
- **Destructured Constructor Props**: All classes must receive their properties/dependencies as a single destructured object in the constructor.
- **Props Interface**: Define a specific interface for the constructor properties (e.g., `MyClassProps`) to maintain type safety and clarity.
- **Example Pattern**:
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

## 6. TypeScript Import Conventions
- **Language**: This project uses TypeScript exclusively.
- **No .js Extensions**: Do NOT add `.js` extensions to import statements. TypeScript will handle module resolution.
- **Type-Only Imports**: When importing only types or interfaces, use the `type` keyword explicitly:
  ```typescript
  import type { MyInterface } from "./path/to/module";
  import { MyClass, type MyType } from "./path/to/module";
  ```
- **Consistency**: All imports must follow this convention throughout the codebase.