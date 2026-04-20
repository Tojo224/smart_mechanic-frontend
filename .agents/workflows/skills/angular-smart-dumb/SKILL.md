---
description: Define el patrón Smart (Pages) vs Dumb (Components) Components en Angular 17+ Standalone. Usar al crear nuevas interfaces de usuario, páginas o formularios.
---

---
name: angular-smart-dumb
description: Define el patrón Smart (Pages) vs Dumb (Components) Components en Angular 17+ Standalone. Usar al crear nuevas interfaces de usuario, páginas o formularios.
---

# Angular Smart vs Dumb Components Architecture

Reglas estrictas para la creación de componentes visuales en el panel administrativo de Smart Mechanic.

## When to use this skill
- Use this when generando nuevos componentes de Angular usando el CLI.
- Use this when diseñando formularios reactivos o interfaces con Angular Material.
- This is helpful for evitar mezclar lógica de negocio (APIs) con diseño UI.

## How to use it

Identifica qué tipo de componente estás creando y aplica sus reglas:

**A. Si es una PÁGINA (Smart Component):**
- Ubicación: `src/app/features/[modulo]/pages/`
- Formato: 1 solo archivo `.ts` usando `template: \`...\`` (HTML en línea). No usar archivo `.scss`.
- Responsabilidad: Inyectar servicios, comunicarse con TanStack Query, manejar enrutamiento. 

**B. Si es un COMPONENTE (Dumb Component):**
- Ubicación: `src/app/features/[modulo]/components/`
- Formato: 3 archivos separados (`.ts`, `.html`, `.scss`).
- Responsabilidad: Interfaz de usuario pura. Usa `ReactiveFormsModule`.
- Restricción: NUNCA inyectar servicios HTTP o Router. Recibir datos solo con `@Input()` y emitir acciones con `@Output()`.

**Convenciones generales:**
- Usar SIEMPRE `standalone: true`. No usar NgModules.
- Usar el nuevo Control Flow de Angular (`@if`, `@for`).