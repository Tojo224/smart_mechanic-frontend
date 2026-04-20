---
description: Establece convenciones para peticiones HTTP con TanStack Query, estado local con NgRx Signals y tipado estricto. Usar al conectar el frontend con APIs.
---

---
name: state-and-performance
description: Establece convenciones para peticiones HTTP con TanStack Query, estado local con NgRx Signals y tipado estricto. Usar al conectar el frontend con APIs.
---

# State Management and Performance

Reglas de rendimiento para evitar fugas de memoria y manejar el estado de la aplicación Angular.

## When to use this skill
- Use this when consumiendo endpoints de FastAPI.
- Use this when compartiendo variables de estado entre componentes.

## How to use it

**Manejo de Estado:**
- **Server State:** Usa `@tanstack/angular-query-experimental` dentro de la carpeta `data-access/` para todo lo que venga del backend.
- **UI State:** Usa Signals nativos de Angular o `@ngrx/signals` dentro de la carpeta `state/`.

**Reglas de Rendimiento:**
- **Prohibido `any`:** Todo debe estar tipado. Usa `unknown` si la respuesta es incierta.
- **Prohibido `.subscribe()` manual:** Usa Signals (`toSignal`) o el pipe `async` en el HTML. Si la suscripción es inevitable, usa `takeUntilDestroyed()`.
- **Inyección:** Usa `inject(NombreServicio)` en lugar del constructor clásico de TypeScript.