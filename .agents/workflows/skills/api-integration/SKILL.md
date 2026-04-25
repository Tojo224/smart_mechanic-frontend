---
description: Reglas para la conexines entre backend y frontend (Angular)
---

# REGLAS ESTRICTAS PARA INTEGRACIÓN DE API (ANGULAR & FLUTTER)

**Objetivo:** Evitar código boilerplate, peticiones largas en los componentes y centralizar la lógica de red usando el patrón API Gateway/Repository.

1. **PROHIBIDO EL CÓDIGO SPAGHETTI EN COMPONENTES:**
   - En Angular: Los componentes NUNCA deben inyectar `HttpClient` directamente.
   - En Flutter: Los Widgets NUNCA deben instanciar `http` o `Dio` directamente.

2. **USO DE INTERCEPTORES CENTRALIZADOS:**
   - Crea un Interceptor global (`auth.interceptor.ts` en Angular / `DioInterceptor` en Flutter).
   - Este interceptor es el ÚNICO responsable de leer el Token JWT del LocalStorage/SecureStorage e inyectarlo en el header `Authorization`.
   - Todas las llamadas a la API deben usar la URL base obtenida de los archivos de Entorno (`environment.ts` o `.env`). ¡Prohibido hardcodear `http://localhost:8000` en los servicios!

3. **CAPA DE SERVICIOS TIPADA (Basada en OpenAPI):**
   - Crea una capa de Servicios (Ej. `AuthService`, `EmergenciesService`) que contenga los métodos puros que apuntan a cada endpoint.
   - Usa los esquemas de validación del `openapi.json` para crear Interfaces en TypeScript y Data Classes genéricas en Dart (usando `json_serializable` o `freezed`).

4. **GESTIÓN DE ESTADO ASÍNCRONO:**
   - Angular: Envuelve las llamadas del Servicio usando `@tanstack/angular-query-experimental`. Retorna las señales de la Query para que el componente HTML (Dumb component) reaccione automáticamente a los estados `isPending`, `isError`, y `data`.
   - Flutter: Usa `Riverpod` (`FutureProvider` o `AsyncNotifierProvider`) para envolver las llamadas. En la UI, usa el patrón `.when(data: , loading: , error: )` de forma estricta.