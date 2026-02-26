# Frontend Architecture & API Contract: Migración a Clean Architecture

## 1. Debate Arquitectónico: Del Monolito a Clean Architecture (Frontend)

### Análisis de la Estructura Actual ("El Monolito Heredado")
El frontend actual (`SistemaTickets/frontend`) presenta una estructura acoplada y menos escalable, característica de un enfoque monolítico inicial.

**"Dolores" identificados en la arquitectura actual:**
1. **Acoplamiento de Lógica y Vista:** Componentes pesados (como `TicketAssign.tsx`) mezclan lógica de obtención de datos, manejo de estado complejo y renderizado, dificultando el testing y la reutilización.
2. **Estructura de Directorios Plana:** Las carpetas `src/components` y `src/pages` contienen componentes mezclados sin clara separación por dominio de negocio (Auth, Tickets, Assignments, Notifications).
3. **Falta de Capa de Dominio:** Toda la lógica de negocio (ej. cálculo de prioridades, formateo de datos) reside dispersa en los componentes de UI o en servicios muy básicos.
4. **Acoplamiento Directo a Axios:** Los llamados a la API (`services/*.ts`) no abstraen correctamente la infraestructura, siendo adaptadores muy delgados que exponen detalles del backend a la UI.

### Beneficios de migrar hacia una Estructura Modular (Clean Architecture)
Proponemos adoptar principios de Clean Architecture y modularidad por características (Feature-Sliced Design) en la próxima iteración del frontend (`sistema_tickets_V2/frontend`):

1. **Separación por Capas y Dominios:**
   - La introducción de una capa de dominio (`src/domain`) aislará la lógica de negocio pura del marco de trabajo (React).
   - Los componentes y páginas se organizarán alrededor de dominios de negocio (feature folders): `tickets`, `assignments`, `auth`, `notifications`.
2. **Desacoplamiento UI-Infraestructura:**
   - Crear servicios que actúen como adaptadores explícitos, mapeando las respuestas crudas del backend a interfaces puras del frontend.
3. **Mantenibilidad y Escalabilidad:** Será mucho más fácil encontrar, probar y modificar funcionalidades, porque el código que cambia junto, vivirá junto, organizado semánticamente.

---

## 2. Plan de Refactorización Propuesto

Para pasar de la arquitectura actual a la propuesta, se deberá aplicar una refactorización profunda alineada a los siguientes objetivos:

1. **Reestructuración de Directorios:**
   - Migrar de una estructura plana a un diseño modular por características. Subdividir `src/components/` y `src/pages/` en módulos como `auth`, `tickets`, `assignments`, `notifications`, `common`, `layout`.
   - Eliminar archivos "Utility" globales que crecen sin control a favor de utilidades específicas por dominio.
2. **Aislamiento de la Lógica de Negocio (Domain Layer):**
   - Extraer reglas críticas como la lógica de prioridad de tickets y ubicarlas en `src/domain/tickets/priorityRules.ts`, permitiendo testear las reglas de negocio independientemente de React.
3. **Capa Adaptadora en Servicios:**
   - Modificar los archivos en `src/services/` para implementar un patrón **Adapter**. Deberán transformar los DTOs del backend en Tipos robustos consumibles por el Frontend, aislando a la UI de futuros cambios de la API (ej. transformar `snake_case` a `camelCase`).
4. **Mejores Prácticas de UI:**
   - Reemplazar funciones bloqueantes y fuertemente acopladas al navegador como `window.alert` por modales de confirmación reutilizables y asíncronos (`ConfirmModal`).
   - Depurar código no utilizado y Hooks "legacy" (como `useFetchOnce`).

---

## 3. Construcción de la API y Contrato (Perspectiva del Frontend)

Como parte de la apertura del sistema, el frontend interactuará con el backend expuesto como una API RESTful. A continuación, se define el contrato de la API que se planea consumir, documentando los verbos HTTP y sus usos esperados.

### Servicio: Tickets API (`/tickets/`)

| Endpoint | Método HTTP | Propósito | Códigos de Estado Esperados |
| :--- | :---: | :--- | :--- |
| `/tickets/` | **GET** | Obtener el listado completo de tickets. | `200 OK` |
| `/tickets/` | **POST** | Crear un nuevo ticket (`CreateTicketDTO`). | `201 Created`, `400 Bad Request` |
| `/tickets/{id}/` | **GET** | Obtener detalle de un ticket específico. | `200 OK`, `404 Not Found` |
| `/tickets/{id}/` | **DELETE** | Eliminar lógicamente un ticket. | `204 No Content`, `404 Not Found` |
| `/tickets/{id}/status/` | **PATCH** | Actualizar el estado (ej. "OPEN", "CLOSED"). | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `/tickets/{id}/priority/` | **PATCH** | Actualizar prioridad (solo Admin con justificación). | `200 OK`, `400 Bad Request`, `403 Forbidden` |
| `/tickets/{id}/responses/` | **GET** | Obtener el hilo de respuestas de un ticket. | `200 OK` |
| `/tickets/{id}/responses/` | **POST** | Agregar una nueva respuesta a un ticket. | `201 Created`, `400 Bad Request` |

### Servicio: Assignments API (`/assignments/`)

| Endpoint | Método HTTP | Propósito | Códigos de Estado Esperados |
| :--- | :---: | :--- | :--- |
| `/assignments/` | **GET** | Obtener historial y estado de asignaciones. | `200 OK` |
| `/assignments/{id}/` | **DELETE** | Eliminar una asignación específica. | `204 No Content`, `404 Not Found` |
| `/assignments/{id}/assign-user/` | **PATCH** | Asignar/Reasignar un agente a un ticket. | `200 OK`, `400 Bad Request`, `404 Not Found` |

### Servicio: Notifications API (`/notifications/`)

| Endpoint | Método HTTP | Propósito | Códigos de Estado Esperados |
| :--- | :---: | :--- | :--- |
| `/notifications/` | **GET** | Obtener notificaciones para el usuario actual. | `200 OK` |
| `/notifications/{id}/read/` | **PATCH** | Marcar una notificación específica como leída. | `200 OK`, `404 Not Found` |
| `/notifications/{id}/` | **DELETE** | Eliminar una sola notificación. | `204 No Content`, `404 Not Found` |
| `/notifications/clear/` | **DELETE** | Eliminar/Marcar como leídas todas las notificaciones. | `204 No Content` |

### Servicio: Users (Auth) API (`/auth/`)

| Endpoint | Método HTTP | Propósito | Códigos de Estado Esperados |
| :--- | :---: | :--- | :--- |
| `/auth/by-role/{role}/` | **GET** | Obtener lista de usuarios por rol (ej. 'ADMIN'). | `200 OK`, `403 Forbidden` |

### Consideraciones sobre Respuestas y HTTP Status Codes:
- **`200 OK`**: A utilizar en operaciones de lectura (GET) o actualizaciones parciales sin creación (PATCH).
- **`201 Created`**: Exclusivamente cuando la solicitud (POST) resulte en un nuevo recurso estructurado en base de datos (Tickets, Respuestas).
- **`400 Bad Request`**: Malformaciones del lado del cliente, DTOs inválidos o reglas de validación fallidas enviadas al backend.
- **`404 Not Found`**: Operaciones sobre ID que no existen (Tickets eliminados, asignaciones borradas).
- **`500 Internal Server Error`**: Excepciones no controladas del backend.
