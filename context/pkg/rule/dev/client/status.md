# Roadmap: Module `client` (@dotagents/rule)

Este plan define la implementación del módulo `client`, encargado de ofrecer una interfaz de alto nivel para consumir las reglas persistidas en `.agents/.ai/` por el módulo `getter`.

| Index | Name | Description | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Domain Definition & Shared Kernel** | Refactorización de elementos comunes a `shared` y definición de Entidades `client`. | 🟢 |
| 2 | **Application Definition** | Definición de Puertos de Lectura, DTOs y Casos de Uso (Listar/Leer). | 🟢 |
| 3 | **Infrastructure Implementation** | Implementación de repositorio de lectura sobre `.agents/.ai/`. | 🟢 |
| 4 | **Integration & API** | Configuración de Inyección de Dependencias y exposición de API de consumo. | 🟢 |
