# Arquitectura del Frontend — Sistema de Tickets

Este documento describe la arquitectura del frontend, las convenciones adoptadas, los contratos de eventos, los estándares de testing y las normas de seguridad/documentación.

---

## Tabla de contenidos

1. [Estructura del proyecto](#1-estructura-del-proyecto)
2. [Domain-Driven Design (DDD)](#2-domain-driven-design-ddd)
3. [Convenciones de naming](#3-convenciones-de-naming)
4. [Reglas de negocio relevantes](#4-reglas-de-negocio-relevantes)
5. [Contratos de eventos (RabbitMQ / SSE)](#5-contratos-de-eventos-rabbitmq--sse)
6. [Testing standards](#6-testing-standards)
7. [Seguridad y documentación](#7-seguridad-y-documentación)

---

## 1. Estructura del proyecto

```
frontend/
├── public/                  # Archivos estáticos servidos directamente
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── auth/            # ProtectedRoute y componentes de autenticación
│   │   ├── common/          # LoadingState, EmptyState y otros de uso general
│   │   ├── layout/          # Layout principal de la aplicación (Navbar, etc.)
│   │   ├── notifications/   # Componentes de notificaciones
│   │   ├── tickets/         # Componentes de gestión de tickets (TicketPriorityManager…)
│   │   └── ui/              # Primitivos de UI sin lógica de dominio
│   ├── context/             # React Contexts globales
│   │   ├── AuthContext.tsx          # Estado de autenticación y sesión del usuario
│   │   ├── NotificationContext.tsx  # Contador de notificaciones no leídas
│   │   └── ToastContext.tsx         # Sistema de toasts/mensajes temporales
│   ├── domain/              # Lógica de dominio pura (sin dependencias de React)
│   │   └── tickets/
│   │       ├── priorityRules.ts     # Validaciones y reglas de prioridad
│   │       └── priorityUtils.ts     # Utilidades de formateo de prioridad
│   ├── hooks/               # Custom hooks de React
│   │   ├── useFetch.ts              # Fetch genérico con estado loading/error
│   │   ├── useSSE.ts                # Conexión Server-Sent Events al notification-service
│   │   └── useTicketDetail.ts       # Lógica de carga de detalle de ticket
│   ├── pages/               # Vistas de la aplicación (páginas)
│   │   ├── assignments/     # Listado de asignaciones (solo ADMIN)
│   │   ├── auth/            # Login y Register
│   │   ├── notifications/   # Listado de notificaciones
│   │   └── tickets/         # TicketList, TicketDetail, CreateTicket
│   ├── routes/
│   │   └── AppRouter.tsx    # Definición de rutas con React Router v7
│   ├── services/            # Clientes HTTP y llamadas a microservicios
│   │   ├── axiosConfig.ts   # Instancias de Axios con interceptores compartidos
│   │   ├── ticketApi.ts     # Llamadas al ticket-service
│   │   ├── notification.ts  # Llamadas al notification-service
│   │   ├── assignment.ts    # Llamadas al assignment-service
│   │   └── user.ts          # Llamadas al users-service
│   ├── styles/              # CSS global
│   ├── test/                # Tests unitarios e integración con Vitest
│   │   ├── __mocks__/       # Mocks compartidos entre tests
│   │   ├── assignments/     # Tests de la sección asignaciones
│   │   ├── components/      # Tests de componentes transversales
│   │   ├── hooks/           # Tests de custom hooks
│   │   ├── navbar/          # Tests del componente de navegación
│   │   ├── notifications/   # Tests de la sección notificaciones
│   │   ├── tickets/         # Tests de la sección tickets
│   │   ├── auth-security.test.ts  # Tests de seguridad de la configuración Axios
│   │   └── setup.ts         # Configuración global de Testing Library (jest-dom)
│   ├── types/               # Definiciones de tipos TypeScript compartidas
│   │   ├── auth.ts
│   │   ├── ticket.ts
│   │   ├── notification.ts
│   │   └── assignment.ts
│   ├── utils/               # Funciones utilitarias genéricas
│   ├── App.tsx              # Punto de entrada de la aplicación React
│   └── main.tsx             # Montaje del árbol de componentes en el DOM
├── .env.example             # Plantilla de variables de entorno
├── Dockerfile               # Imagen de producción (Nginx)
├── nginx.conf               # Configuración del servidor Nginx
├── index.html               # HTML raíz de Vite
├── vite.config.ts           # Configuración de Vite
├── tsconfig.json            # Configuración base de TypeScript
└── package.json
```

---

## 2. Domain-Driven Design (DDD)

### Principio general

La capa de **dominio** (`src/domain/`) contiene **funciones puras** que encapsulan las reglas de negocio y son completamente independientes de React, del DOM y de cualquier efecto secundario. Esto permite testearlas de forma aislada y reutilizarlas desde componentes, hooks o tests sin necesidad de renderizar nada.

### Subdominios representados

| Subdomain | Carpeta | Responsabilidad |
|---|---|---|
| Tickets | `src/domain/tickets/` | Reglas de prioridad, validaciones de transición de estado |
| Auth | `src/types/auth.ts` + `src/context/AuthContext.tsx` | Tipado de usuario y gestión de sesión |
| Notificaciones | `src/hooks/useSSE.ts` + `src/context/NotificationContext.tsx` | Entrega de eventos en tiempo real |

### Separación de capas

```
domain/          ← lógica pura, sin React, sin HTTP
   ↑
services/        ← llamadas HTTP a microservicios (Axios)
   ↑
hooks/           ← estado derivado, efectos, integración contextos
   ↑
components/      ← presentación y eventos de usuario
   ↑
pages/           ← composición de componentes para cada ruta
```

Los módulos de dominio **no importan** de `services/`, `hooks/` ni de React. Los servicios **no importan** de componentes ni de páginas.

---

## 3. Convenciones de naming

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase + `.tsx` | `TicketPriorityManager.tsx` |
| Páginas | PascalCase + `.tsx` | `TicketDetail.tsx` |
| Hooks | camelCase con prefijo `use` + `.ts` | `useSSE.ts` |
| Contextos | PascalCase + `Context.tsx` | `AuthContext.tsx` |
| Servicios | camelCase + `.ts` | `ticketApi.ts`, `axiosConfig.ts` |
| Tipos | camelCase + `.ts` | `ticket.ts`, `auth.ts` |
| Reglas de dominio | camelCase descriptivo + `.ts` | `priorityRules.ts` |
| Tests | mismo nombre que el módulo + `.test.ts(x)` | `TicketPriorityManager.test.tsx` |
| Carpetas | camelCase o kebab-case en minúsculas | `tickets/`, `auth/`, `__mocks__/` |

### Identificadores TypeScript

| Tipo | Convención | Ejemplo |
|---|---|---|
| Interfaces y tipos | PascalCase | `Ticket`, `AuthContextType`, `UpdatePriorityDTO` |
| Enums / union types | PascalCase | `TicketStatus`, `TicketPriority`, `UserRole` |
| Variables / funciones | camelCase | `refreshUnread`, `buildPriorityPayload` |
| Constantes de módulo | UPPER_SNAKE_CASE | `EDITABLE_STATUSES`, `SSE_BASE_URL` |
| Props de componentes | PascalCase para el tipo, camelCase para los valores | `interface TicketProps { ticketId: number }` |

### Variables de entorno

Todas las variables expuestas al navegador usan el prefijo `VITE_` (requerido por Vite). Las variables de backend **no** se incluyen en el frontend.

```
VITE_TICKET_SERVICE_URL
VITE_NOTIFICATION_SERVICE_URL
VITE_ASSIGNMENT_SERVICE_URL
VITE_USERS_SERVICE_URL
VITE_NOTIFICATION_BASE_URL   # base para la conexión SSE
```

---

## 4. Reglas de negocio relevantes

### Roles de usuario

| Rol | Valor | Acceso |
|---|---|---|
| Usuario regular | `USER` | Crear tickets, ver propios tickets, ver notificaciones propias |
| Administrador | `ADMIN` | Todo lo anterior + gestionar prioridades, ver asignaciones, ver todas las notificaciones |

### Gestión de prioridad de tickets

Implementada en `src/domain/tickets/priorityRules.ts`:

1. **Solo ADMIN puede gestionar la prioridad** (`canManagePriority`): requiere `user.role === 'ADMIN'`.
2. **El ticket debe estar en estado editable** (`EDITABLE_STATUSES = ['OPEN', 'IN_PROGRESS']`): los tickets `CLOSED` no admiten cambios de prioridad.
3. **No se puede volver a `Unassigned`** (`isValidPriorityTransition`): una vez asignada una prioridad distinta de `Unassigned`, la transición a `Unassigned` queda bloqueada.
4. **Prioridades asignables** (`ASSIGNABLE_PRIORITY_OPTIONS`): `Low`, `Medium`, `High`. El valor `Unassigned` es solo lectura.
5. **Justificación opcional** (`buildPriorityPayload`): si el usuario introduce una justificación no vacía, se incluye en el payload enviado a la API.

### Autenticación y sesión

- JWT almacenado en **cookies HttpOnly** gestionadas por el backend. El frontend nunca accede directamente al token.
- Al recibir un error `401`, los interceptores de Axios intentan un **único refresco automático** (`/auth/refresh/`) antes de redirigir a `/login`.
- La autenticación es global vía `AuthContext`. La propiedad `isAdmin` se deriva de `user.role === 'ADMIN'`.

### Rutas protegidas

- `ProtectedRoute` bloquea el acceso a rutas privadas para usuarios no autenticados.
- El parámetro `requireAdmin={true}` restringe rutas adicionales (asignaciones, notificaciones) solo a ADMIN.

---

## 5. Contratos de eventos (RabbitMQ / SSE)

### Arquitectura de mensajería

El backend utiliza **RabbitMQ** como bus de eventos entre microservicios. El exchange principal es `ticket_events`.

| Cola | Servicio consumidor |
|---|---|
| `assignment_queue` | assignment-service |
| `notification_queue` | notification-service |
| `users_queue` | users-service |

### Eventos publicados por ticket-service

| Evento (routing key) | Descripción | Campos principales |
|---|---|---|
| `ticket.created` | Nuevo ticket creado | `ticket_id`, `user_id`, `title` |
| `ticket.status_changed` | Estado de ticket modificado | `ticket_id`, `status` |
| `ticket.priority_changed` | Prioridad de ticket modificada | `ticket_id`, `priority`, `justification?` |
| `ticket.response_added` | Respuesta de admin añadida | `ticket_id`, `admin_id`, `admin_name`, `text` |

### Server-Sent Events (SSE) — notification-service → frontend

El frontend se suscribe a eventos en tiempo real a través de `useSSE` (`src/hooks/useSSE.ts`).

**Endpoint:**
```
GET /api/notifications/sse/<user_id>/
```

**Evento escuchado:** `notification`

**Payload esperado:**
```typescript
interface SSENotificationPayload {
  ticket_id: number;   // ID del ticket relacionado
  message?: string;    // Descripción opcional del evento
  [key: string]: unknown;
}
```

**Comportamiento del hook `useSSE`:**

1. Abre la conexión `EventSource` solo cuando el usuario está autenticado.
2. Al recibir `notification`:
   - Llama a `refreshUnread()` del `NotificationContext` para actualizar el badge global.
   - Si el `ticket_id` del evento coincide con el ticket actualmente abierto (`currentTicketId`), invoca `onRefreshResponses()` para recargar las respuestas del detalle de ticket.
3. Cierra la conexión al desmontar el componente.
4. Los errores de transporte se registran como `debug` (EventSource reintenta automáticamente).

### Tipo `TicketResponse` — contrato frontend/backend

```typescript
// src/types/ticket.ts
interface TicketResponse {
  id: number;
  ticket_id: number;
  admin_id: string;
  admin_name: string;
  text: string;
  created_at: string;
}
```

Este contrato está alineado con el evento `ticket.response_added` publicado por el ticket-service.

---

## 6. Testing standards

### Stack

| Herramienta | Rol |
|---|---|
| **Vitest** | Test runner (integrado con Vite) |
| **Testing Library (`@testing-library/react`)** | Renderizado y queries de componentes |
| **`@testing-library/user-event`** | Simulación de interacciones de usuario |
| **`@testing-library/jest-dom`** | Matchers adicionales para el DOM (`.toBeInTheDocument()`, etc.) |
| **jsdom** | Entorno DOM para tests sin navegador |

### Configuración

- El setup global se encuentra en `src/test/setup.ts` e importa `@testing-library/jest-dom` para registrar los matchers.
- Vitest está configurado en `vite.config.ts`.

### Metodología TDD (Red-Green-Refactor)

Los tests se escriben **antes** de la implementación (fase RED) y la implementación se desarrolla hasta que todos pasen (fase GREEN). Esto es especialmente aplicable a módulos de dominio y componentes nuevos.

### Organización de tests

- Los tests se ubican en `src/test/`, espejando la estructura de `src/`.
- Los tests de dominio puro (funciones sin React) van en archivos `.test.ts`.
- Los tests de componentes van en archivos `.test.tsx`.
- Los mocks compartidos se colocan en `src/test/__mocks__/`.

### Qué testear

| Tipo de módulo | Qué verificar |
|---|---|
| Dominio (`domain/`) | Resultados de funciones puras para todas las entradas relevantes, incluyendo casos borde |
| Servicios (`services/`) | Configuración de clientes Axios (ej. `withCredentials`) |
| Componentes (`components/`) | Renderizado condicional por rol/estado, interacciones de usuario, llamadas a la API mockeada |
| Hooks (`hooks/`) | Comportamiento ante cambios de estado, correcta limpieza de efectos |

### Mocking

- Los módulos de servicio se mockean con `vi.mock(...)`.
- Los contextos de React (Auth, Notifications) se mockean vía `vi.mock(...)` sobre el módulo del contexto.
- Los mocks se resetean en `beforeEach` con `vi.clearAllMocks()`.

### Comandos

```bash
npm run test          # Ejecuta todos los tests una vez
npm run test:watch    # Modo watch para desarrollo
```

---

## 7. Seguridad y documentación

### Autenticación

- Los tokens JWT **nunca** se almacenan en `localStorage` ni en variables de JavaScript. Se usan **cookies HttpOnly** gestionadas automáticamente por el navegador.
- Todos los clientes Axios tienen `withCredentials: true` para que las cookies se envíen en cada petición cross-origin.
- El interceptor de refresco utiliza una única promesa en vuelo (`refreshPromise`) para evitar múltiples refreshes simultáneos ante errores `401` concurrentes.

### Variables de entorno

- Las variables sensibles (claves secretas, contraseñas de base de datos) **no pertenecen al frontend** y no deben incluirse en ningún archivo con prefijo `VITE_`.
- El archivo `.env` está en `.gitignore`. Solo se versiona `.env.example` con valores de ejemplo.

### Control de acceso en el frontend

- La verificación de rol en el frontend es **solo visual** (ocultar controles al usuario). La autorización real se aplica en el backend.
- `ProtectedRoute` redirige a `/login` si el usuario no está autenticado.

### Documentación de código

- Las funciones públicas de módulos de dominio y servicios se documentan con **JSDoc**: descripción, `@param` y `@returns`.
- Los tipos e interfaces se documentan con comentarios inline cuando su propósito no es evidente.
- Los módulos con reglas de negocio incluyen un bloque de comentario al inicio explicando su responsabilidad y restricciones (ver `priorityRules.ts`).
- Los contratos entre frontend y backend (tipos de respuesta API, payloads de eventos) se documentan en `src/types/`.

### CORS

En producción, `CORS_ALLOWED_ORIGINS` debe contener únicamente los orígenes autorizados. No usar `*`.
