# 🏗️ ARCHITECTURE.md — Frontend del Sistema de Tickets

> **Documento de debate arquitectónico**, plan de refactorización y contrato de API REST.
> Redactado como propuesta técnica previa a la implementación.

---

## Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Debate Arquitectónico: Monolito vs. Clean Architecture](#2-debate-arquitectónico-monolito-vs-clean-architecture)
3. [Estructura del Proyecto Actual (Monolito Heredado)](#3-estructura-del-proyecto-actual-monolito-heredado)
4. [Propuesta de Arquitectura: Estructura Objetivo](#4-propuesta-de-arquitectura-estructura-objetivo)
5. [Capas de la Arquitectura Propuesta](#5-capas-de-la-arquitectura-propuesta)
6. [Plan de Refactorización](#6-plan-de-refactorización)
7. [Contrato de la API REST](#7-contrato-de-la-api-rest)
8. [Autenticación y Seguridad](#8-autenticación-y-seguridad)
9. [Comunicación en Tiempo Real (SSE)](#9-comunicación-en-tiempo-real-sse)
10. [Estrategia de Testing](#10-estrategia-de-testing)
11. [Despliegue e Infraestructura](#11-despliegue-e-infraestructura)

---

## 1. Stack Tecnológico

| Categoría | Tecnología | Versión |
| :--- | :--- | :--- |
| Framework UI | React | 19.x |
| Lenguaje | TypeScript | ~5.9 |
| Build tool | Vite | 7.x |
| Routing | React Router DOM | 7.x |
| HTTP Client | Axios | 1.x |
| Iconos | lucide-react | 0.x |
| Testing | Vitest + Testing Library | 1.x / 16.x |
| Linter | ESLint | 9.x |
| Servidor de producción | Nginx (Alpine) | 1.27 |
| Contenedores | Docker (multi-stage build) | — |

---

## 2. Debate Arquitectónico: Monolito vs. Clean Architecture

### 2.1 "Dolores" del Monolito Heredado

El frontend actual presenta problemas estructurales bien documentados en la literatura como síntomas de un **monolito frontend**:

| # | Problema | Impacto | Ejemplo Concreto |
| :---: | :--- | :--- | :--- |
| 1 | **Acoplamiento Lógica ↔ Vista** | Componentes pesados mezclan fetch de datos, estado complejo y renderizado en un solo archivo. Testing unitario muy difícil. | `TicketAssign.tsx` contiene lógica de obtención de admins, validación de prioridad y renderizado, todo en un ~150 líneas. |
| 2 | **Estructura de directorios plana** | No hay separación por dominio de negocio. Dificultad para localizar código relacionado a una feature. | `src/components/` tiene `ConfirmModal`, `ProtectedRoute` y `TicketAssign` al mismo nivel, sin relación funcional. |
| 3 | **Ausencia de capa de dominio** | Reglas de negocio (ej. ¿quién puede cambiar prioridad?, ¿qué transiciones son válidas?) están embebidas en componentes React. Imposible testear sin montar el componente. | Validaciones de prioridad viven dentro de handlers `onClick` en la vista. |
| 4 | **Servicios sin abstracción** | Los `services/*.ts` son wrappers delgados sobre `axios` que exponen directamente la estructura del backend (`snake_case`, IDs como `string` vs `number`). | Un cambio en el DTO del backend rompe toda la UI. |
| 5 | **Código muerto y prácticas legacy** | Uso de `window.alert`, hooks deprecados (`useFetchOnce`), servicio `auth.ts` no utilizado. | Ruido en el codebase, confusión para nuevos desarrolladores. |
| 6 | **Sin estrategia de despliegue** | No hay Dockerfile, configuración de nginx ni proceso de build estandarizado para producción. | Despliegue manual y propenso a errores. |

### 2.2 Beneficios Esperados de Clean Architecture

Migrar a una arquitectura limpia orientada a **Feature-Sliced Design** aportará:

| Beneficio | Descripción |
| :--- | :--- |
| **Testabilidad** | La capa de dominio se compone de funciones puras, testeables sin React, sin mocks de API, sin JSDOM. |
| **Independencia de framework** | Las reglas de negocio no dependen de React. Si se migra a otro framework, el `domain/` se lleva intacto. |
| **Desacoplamiento Backend ↔ Frontend** | El patrón *Adapter* en los servicios aísla a la UI de cambios en los DTOs del backend. |
| **Colocalización** | Código que cambia junto, vive junto. Componentes, estilos y tests agrupados por feature. |
| **Onboarding simplificado** | Nuevos desarrolladores entienden la estructura intuitivamente: `tickets/`, `assignments/`, `notifications/`. |
| **Escalabilidad horizontal** | Agregar un nuevo dominio (ej. `reports/`) es crear una carpeta y seguir el patrón existente. |

### 2.3 Diagrama: Arquitectura por Capas Propuesta

```
┌──────────────────────────────────────────────────────────────────────┐
│                          PRESENTACIÓN (UI)                           │
│   pages/         → Páginas/vistas (composición de componentes)       │
│   components/    → Componentes reutilizables organizados por feature │
│   styles/        → Sistema de diseño y estilos globales              │
├──────────────────────────────────────────────────────────────────────┤
│                        ESTADO Y ORQUESTACIÓN                         │
│   context/       → Providers globales (Auth, Notifications, Toast, Theme) │
│   hooks/         → Custom hooks (useFetch, useSSE, useTicketDetail)  │
├──────────────────────────────────────────────────────────────────────┤
│                          DOMINIO (NEGOCIO)                           │
│   domain/        → Reglas puras sin dependencias de React            │
│   types/         → Interfaces y DTOs del sistema                     │
├──────────────────────────────────────────────────────────────────────┤
│                     INFRAESTRUCTURA (SERVICIOS)                      │
│   services/      → Adaptadores HTTP (Axios → Tipos del frontend)     │
│   utils/         → Utilidades genéricas (formateo de fechas, etc.)   │
└──────────────────────────────────────────────────────────────────────┘
         │                                          │
         ▼                                          ▼
┌─────────────────┐                    ┌─────────────────────────┐
│   Backend APIs  │                    │   SSE (Tiempo Real)     │
│  (4 Microservs) │                    │  notification-service   │
└─────────────────┘                    └─────────────────────────┘
```

---

## 3. Estructura del Proyecto Actual (Monolito Heredado)

```
src/
├── App.tsx                       ← Entrada (sin providers claros)
├── main.tsx
├── assets/
├── components/
│   ├── ConfirmModal.tsx          ← Componente genérico mezclado con...
│   ├── ConfirmModal.css
│   ├── ProtectedRoute.tsx        ← ...guard de autenticación...
│   ├── TicketAssign.tsx          ← ...y componente de feature (tickets)
│   ├── TicketAssign.css
│   └── common/                   ← Subdirectorio para elementos genéricos
├── context/
│   └── AuthContext.tsx            ← Solo un provider
│   └── (sin NotificationContext ni ToastContext)
├── hooks/
│   └── useFetch.ts
│   └── (sin useSSE ni useTicketDetail)
├── pages/
│   ├── assignments/
│   ├── auth/
│   ├── navbar/                   ← Navbar clasificado como "página"
│   ├── notifications/
│   └── tickets/                  ← 18 archivos — demasiado denso
├── routes/
│   └── AppRouter.tsx
├── services/
│   ├── auth.ts                   ← ⚠️ No utilizado (código muerto)
│   ├── assignment.ts
│   ├── axiosConfig.ts
│   ├── notification.ts
│   ├── ticketApi.ts
│   └── user.ts
├── styles/
├── test/
├── types/
└── utils/
```

**Problemas identificados:**
- `components/` mezcla UI genérica, guards y componentes de feature.
- `pages/navbar/` — la Navbar no es una "página".
- `services/auth.ts` — código muerto que genera confusión.
- Sin capa `domain/` — reglas de negocio dispersas en componentes.
- Sin contextos para Notifications ni Toast (se usa `window.alert`).

---

## 4. Propuesta de Arquitectura: Estructura Objetivo

```
src/
├── App.tsx                         ← Composición de providers
├── main.tsx
│
├── domain/                         ← 🆕 CAPA DE DOMINIO (funciones puras)
│   └── tickets/
│       ├── priorityRules.ts        ← Reglas: quién puede, qué transiciones
│       └── priorityUtils.ts        ← Formateo de etiquetas de prioridad
│
├── types/                          ← Contratos de datos tipados
│   ├── ticket.ts                   ← Ticket, CreateTicketDTO, TicketResponse
│   ├── auth.ts                     ← User, LoginRequest, AuthResponse
│   ├── assignment.ts               ← Assignment, UpdateAssignedUserDTO
│   ├── notification.ts             ← Notification
│   └── user.ts                     ← AdminUser (separado de services)
│
├── services/                       ← ADAPTADORES HTTP (patrón Adapter)
│   ├── axiosConfig.ts              ← 4 clientes Axios + interceptores + refresh
│   ├── ticketApi.ts                ← Adaptador para ticket-service
│   ├── assignment.ts               ← Adaptador para assignment-service
│   ├── notification.ts             ← Adaptador para notification-service
│   └── user.ts                     ← Adaptador para users-service
│                                      ✅ Se elimina auth.ts (código muerto)
│
├── context/                        ← ESTADO GLOBAL
│   ├── AuthContext.tsx              ← Login/Logout/Register + sesión
│   ├── NotificationContext.tsx      ← 🆕 Trigger para refrescar badge
│   ├── ToastContext.tsx             ← 🆕 Reemplaza window.alert
│   └── ThemeContext.tsx             ← 🆕 Dark/Light mode con persistencia
│
├── hooks/                          ← CUSTOM HOOKS
│   ├── useFetch.ts                 ← Fetch genérico con AbortController
│   ├── useSSE.ts                   ← 🆕 Server-Sent Events listener
│   └── useTicketDetail.ts          ← 🆕 Carga ticket + respuestas + optimistic updates
│
├── components/                     ← UI ORGANIZADA POR FEATURE
│   ├── auth/
│   │   └── ProtectedRoute.tsx      ← Guard con soporte requireAdmin
│   ├── common/
│   │   └── (componentes reutilizables)
│   ├── layout/                     ← 🆕 Capa de layout
│   │   ├── Layout.tsx              ← Wrapper: Navbar + SSEGlobalListener
│   │   ├── SSEGlobalListener.tsx   ← Listener SSE para rutas sin detalle
│   │   └── Navbar/
│   │       ├── NavBar.tsx
│   │       ├── NavBar.css
│   │       └── NotificationBadge.tsx
│   ├── notifications/
│   │   └── NotificationItem.tsx
│   ├── tickets/                    ← Componentes granulares de tickets
│   │   ├── TicketForm.tsx / .css
│   │   ├── TicketItem.tsx / .css
│   │   ├── TicketAssign.tsx / .css
│   │   ├── TicketPriorityManager.tsx / .css
│   │   └── AdminResponseForm.tsx / .css
│   └── ui/
│       └── ConfirmModal.tsx / .css  ← Modales reutilizables
│
├── pages/                          ← PÁGINAS (composición)
│   ├── auth/
│   │   ├── Login.tsx / .css
│   │   └── Register.tsx / .css
│   ├── tickets/
│   │   ├── TicketList.tsx / .css
│   │   ├── TicketDetail.tsx / .css
│   │   └── CreateTicket.tsx / .css
│   ├── assignments/
│   │   └── AssignmentList.tsx / .css
│   └── notifications/
│       └── NotificationList.tsx / .css
│
├── routes/
│   └── AppRouter.tsx               ← Rutas con React.lazy + Suspense + guards
├── styles/
│   └── index.css                   ← Design tokens (CSS custom properties) + dark mode
├── test/                           ← Tests organizados por capa y feature
├── utils/
│   └── dateFormat.ts
```

---

## 5. Capas de la Arquitectura Propuesta

### 5.1 Capa de Dominio (`domain/`)

La capa más importante de la migración. Contiene **funciones puras** sin dependencias de React:

| Archivo | Responsabilidad |
| :--- | :--- |
| `priorityRules.ts` | `canManagePriority()` — ¿el usuario puede cambiar prioridad? (rol ADMIN + estado OPEN/IN_PROGRESS). `isValidPriorityTransition()` — ¿la transición es válida? `buildPriorityPayload()` — construir el DTO para la API. `resolvePriorityErrorMessage()` — mapeo de errores HTTP a mensajes. |
| `priorityUtils.ts` | `formatPriority()` — convertir `'High'` → `'Alta'` para la UI. |

**Regla de dependencia:** `domain/` solo importa de `types/`. Nunca de `services/`, `hooks/`, ni `components/`.

### 5.2 Capa de Tipos (`types/`)

Contratos de datos que definen la interfaz entre capas:

| Tipo | Propiedades clave |
| :--- | :--- |
| `Ticket` | `id`, `title`, `description`, `status` (OPEN/IN_PROGRESS/CLOSED), `priority` (Unassigned/Low/Medium/High), `user_id`, `created_at` |
| `TicketResponse` | `id`, `ticket_id`, `admin_id`, `admin_name`, `text`, `created_at` |
| `User` | `id`, `email`, `username`, `role` (ADMIN/USER), `is_active` |
| `Assignment` | `id`, `ticket_id`, `priority`, `assigned_at`, `assigned_to?` |
| `Notification` | `id` (number), `title`, `message`, `read`, `createdAt` |
| `AdminUser` | `id`, `username`, `email`, `role`, `is_active` |

### 5.3 Capa de Servicios (`services/`) — Patrón Adapter

Los servicios actúan como **adaptadores** entre la API REST del backend y los tipos internos del frontend:

```
Backend DTO (snake_case)  →  Adapter Function  →  Frontend Type (camelCase)
```

**Ejemplo en `notification.ts`:**
- El backend devuelve `{ id: number, ticket_id: string, sent_at: string }`.
- El adaptador `adaptNotification()` transforma a `{ id: number, title: "Ticket #X", createdAt: string }`.
- La UI **nunca** ve la estructura raw del backend.

**Infraestructura HTTP (`axiosConfig.ts`):**
- 4 instancias Axios independientes para los 4 microservicios:
  - `ticketApiClient` → `http://localhost:8000/api`
  - `notificationApiClient` → `http://localhost:8001/api`
  - `assignmentApiClient` → `http://localhost:8002/api`
  - `usersApiClient` → `http://localhost:8003/api`
- Interceptor de request: logging de cada petición.
- Interceptor de response: manejo automático de **token refresh** en errores `401` con retry transparente.
- Singleton de refresh para evitar carreras.

### 5.4 Capa de Estado (`context/` + `hooks/`)

| Provider / Hook | Responsabilidad |
| :--- | :--- |
| `AuthContext` | Estado global de sesión (login, logout, register, refreshUser). Cookies HttpOnly. Expone `isAuthenticated` e `isAdmin`. |
| `NotificationContext` | Contador trigger para refrescar el badge de notificaciones (incrementado por SSE o acciones del usuario). |
| `ToastContext` | Sistema de notificaciones visuales no-bloqueantes con auto-dismiss (4s). Tipos: success, error, info. Reemplaza `window.alert`. |
| `ThemeContext` | 🆕 Gestión de tema oscuro/claro. Persiste preferencia en localStorage. Aplica `data-theme` en `<html>`. |
| `useFetch` | Hook genérico: ejecuta un fetch con `AbortController` al montar + cleanup automático. Usa `useRef` para callbacks estables. |
| `useSSE` | Hook que abre conexión `EventSource` con el `notification-service`. Al recibir evento, refresca badge y opcionalmente recarga respuestas del ticket activo. |
| `useTicketDetail` | Hook compuesto: carga ticket + respuestas en paralelo (`Promise.all`), expone `appendResponse` para optimistic updates y `fetchResponses` para SSE-driven refreshes. |

**Jerarquía de Providers en `App.tsx`:**
```
ThemeProvider → ToastProvider → AuthProvider → NotificationProvider → AppRouter
```

### 5.5 Capa de Presentación (`components/` + `pages/`)

**Componentes** organizados por feature (tickets, auth, notifications, layout, ui, common).

**Páginas** orquestan componentes y hooks para funcionalidades completas:

| Página | Ruta | Acceso |
| :--- | :--- | :--- |
| `Login` | `/login` | Público |
| `Register` | `/register` | Público |
| `TicketList` | `/tickets` | Autenticado |
| `CreateTicket` | `/tickets/new` | Autenticado |
| `TicketDetail` | `/tickets/:id` | Autenticado |
| `NotificationList` | `/notifications` | Solo ADMIN |
| `AssignmentList` | `/assignments` | Solo ADMIN |
| `NotFound` | `*` (wildcard) | Público |

**Route-based code splitting:**
- Todas las páginas se cargan con `React.lazy()` + `<Suspense>` para code splitting.
- Cada página genera un chunk JS independiente en el build de producción.

**Sistema de Diseño:**
- CSS custom properties (design tokens) definidos en `index.css`.
- Dark mode soportado via `[data-theme="dark"]` selector.
- Iconografía unificada con `lucide-react` en toda la aplicación.

**Layout inteligente:**
- `Layout.tsx` muestra `Navbar` y `SSEGlobalListener` solo en rutas autenticadas.
- `SSEGlobalListener` se desactiva automáticamente en `TicketDetail` (que tiene su propia conexión SSE contextual).

---

## 6. Plan de Refactorización

Se deberán aplicar los siguientes cambios para pasar del monolito heredado a la arquitectura propuesta:

### 6.1 Reestructuración de Directorios

| Acción | De (V1) | A (V2) |
| :--- | :--- | :--- |
| Mover guards | `components/ProtectedRoute.tsx` | `components/auth/ProtectedRoute.tsx` |
| Mover modales | `components/ConfirmModal.tsx` | `components/ui/ConfirmModal.tsx` |
| Mover componentes de ticket | `components/TicketAssign.tsx` | `components/tickets/TicketAssign.tsx` |
| Extraer Navbar | `pages/navbar/` | `components/layout/Navbar/` |
| Crear layout wrapper | *(no existe)* | `components/layout/Layout.tsx` |
| Crear SSE listener | *(no existe)* | `components/layout/SSEGlobalListener.tsx` |
| Crear capa de dominio | *(no existe)* | `domain/tickets/` |

### 6.2 Nuevos Archivos

| Archivo | Tipo | Propósito |
| :--- | :--- | :--- |
| `domain/tickets/priorityRules.ts` | Dominio | Reglas de negocio puras para prioridad |
| `domain/tickets/priorityUtils.ts` | Dominio | Formateo de etiquetas de prioridad |
| `context/NotificationContext.tsx` | Estado | Trigger global para badge de notificaciones |
| `context/ToastContext.tsx` | Estado | Reemplazo de `window.alert` |
| `hooks/useSSE.ts` | Hook | Conexión Server-Sent Events |
| `hooks/useTicketDetail.ts` | Hook | Carga de detalle de ticket + respuestas |
| `components/layout/Layout.tsx` | UI | Wrapper inteligente con Navbar condicional |
| `components/tickets/TicketPriorityManager.tsx` | UI | Componente especializado de prioridad extraído de TicketAssign |
| `components/tickets/AdminResponseForm.tsx` | UI | Formulario extraído para respuestas admin |

### 6.3 Archivos a Eliminar

| Archivo | Razón |
| :--- | :--- |
| `services/auth.ts` | Código muerto, no utilizado en ninguna parte |
| `hooks/useFetchOnce.ts` (si existe) | Hook deprecado, reemplazado por `useFetch` |

### 6.4 Mejoras de Código

| Cambio | Antes | Después |
| :--- | :--- | :--- |
| Notificaciones al usuario | `window.alert("Éxito")` | `showToast("Éxito", "success")` |
| Confirmaciones | `window.confirm("¿Seguro?")` | `<ConfirmModal />` asíncrono |
| Adaptación de DTOs | Acceso directo a `response.data.snake_case` | Función `adaptX()` intermedia |
| Interceptores | Sin refresh automático | Retry transparente en 401 con singleton |

---

## 7. Contrato de la API REST

El frontend se comunicará con 4 microservicios backend a través de una API RESTful. A continuación se documenta el contrato completo:

### 7.1 Tickets Service (`ticket-service` — `:8000`)

| Endpoint | Verbo | Propósito | Request Body | Response | Códigos |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/tickets/` | **GET** | Listar todos los tickets | — | `Ticket[]` | `200` |
| `/api/tickets/` | **POST** | Crear ticket | `CreateTicketDTO` | `Ticket` | `201`, `400` |
| `/api/tickets/{id}/` | **GET** | Detalle de un ticket | — | `Ticket` | `200`, `404` |
| `/api/tickets/{id}/` | **DELETE** | Eliminar ticket | — | — | `204`, `404` |
| `/api/tickets/{id}/status/` | **PATCH** | Cambiar estado | `{ status: string }` | `Ticket` | `200`, `400`, `404` |
| `/api/tickets/{id}/priority/` | **PATCH** | Cambiar prioridad (Admin) | `UpdatePriorityDTO` | `Ticket` | `200`, `400`, `403` |
| `/api/tickets/{id}/responses/` | **GET** | Listar respuestas | — | `TicketResponse[]` | `200` |
| `/api/tickets/{id}/responses/` | **POST** | Agregar respuesta (Admin) | `{ text, admin_id }` | `TicketResponse` | `201`, `400` |

### 7.2 Assignment Service (`assignment-service` — `:8002`)

| Endpoint | Verbo | Propósito | Request Body | Response | Códigos |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/assignments/` | **GET** | Listar asignaciones | — | `Assignment[]` | `200` |
| `/api/assignments/{id}/` | **DELETE** | Eliminar asignación | — | — | `204`, `404` |
| `/api/assignments/{id}/assign-user/` | **PATCH** | Asignar agente | `UpdateAssignedUserDTO` | `Assignment` | `200`, `400`, `404` |

### 7.3 Notification Service (`notification-service` — `:8001`)

| Endpoint | Verbo | Propósito | Request Body | Response | Códigos |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/notifications/` | **GET** | Listar notificaciones | — | `Notification[]` | `200` |
| `/api/notifications/{id}/read/` | **PATCH** | Marcar como leída | `{}` | — | `200`, `404` |
| `/api/notifications/{id}/` | **DELETE** | Eliminar notificación | — | — | `204`, `404` |
| `/api/notifications/clear/` | **DELETE** | Borrar todas | — | — | `204` |
| `/api/notifications/sse/{userId}/` | **GET** | Stream SSE | — | `EventSource` | `200` |

### 7.4 Users Service (`users-service` — `:8003`)

| Endpoint | Verbo | Propósito | Request Body | Response | Códigos |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/auth/` | **POST** | Registrar usuario | `RegisterRequest` | `AuthResponse` | `201`, `400` |
| `/api/auth/login/` | **POST** | Iniciar sesión | `LoginRequest` | `AuthResponse` | `200`, `401` |
| `/api/auth/logout/` | **POST** | Cerrar sesión | — | — | `200` |
| `/api/auth/me/` | **GET** | Obtener usuario actual | — | `User` | `200`, `401` |
| `/api/auth/refresh/` | **POST** | Refrescar tokens | — | — | `200`, `401` |
| `/api/auth/by-role/{role}/` | **GET** | Usuarios por rol | — | `AdminUser[]` | `200`, `403` |

### 7.5 Uso Semántico de Verbos HTTP

| Verbo | Uso en el Sistema | Semántica |
| :---: | :--- | :--- |
| **GET** | Lectura de recursos. Idempotente y seguro. | No modifica estado del servidor. |
| **POST** | Creación de nuevos recursos (tickets, respuestas, sesiones). | Genera un nuevo recurso con `201 Created`. |
| **PATCH** | Modificación parcial (estado, prioridad, asignación). | Solo envía campos a modificar, no el recurso completo. |
| **DELETE** | Eliminación de recursos (tickets, asignaciones, notificaciones). | Retorna `204 No Content` sin body. |

### 7.6 Códigos de Estado HTTP

| Código | Significado | Cuándo se usa |
| :---: | :--- | :--- |
| `200 OK` | Operación exitosa | GET, PATCH, POST (login) |
| `201 Created` | Recurso creado | POST (tickets, respuestas, registro) |
| `204 No Content` | Eliminación exitosa | DELETE |
| `400 Bad Request` | Datos inválidos | DTOs malformados, validaciones fallidas |
| `401 Unauthorized` | No autenticado | Token expirado o inexistente |
| `403 Forbidden` | Sin permisos | Usuario no-admin intentando operación admin |
| `404 Not Found` | Recurso inexistente | ID de ticket/asignación/notificación no encontrado |
| `500 Internal Server Error` | Error del servidor | Excepción no controlada en el backend |

---

## 8. Autenticación y Seguridad

### Flujo de Autenticación Propuesto

```
┌─────────┐    POST /auth/login/    ┌──────────────┐
│  Login   │ ───────────────────▶   │ users-service │
│  Form    │                        │              │
│         │  ◀── Set-Cookie: JWT ── │              │
└─────────┘   (HttpOnly, Secure)    └──────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Todas las requests subsiguientes incluyen      │
│  la cookie automáticamente (withCredentials)    │
│                                                 │
│  Si recibimos 401 → refreshAuthCookie()         │
│  Si refresh falla → redirect a /login           │
└─────────────────────────────────────────────────┘
```

**Principios de seguridad:**
- Los tokens JWT se almacenan en **cookies HttpOnly** — el JavaScript nunca accede a los tokens directamente.
- `withCredentials: true` en todos los clientes Axios.
- Refresh automático transparente en el interceptor de respuesta (un solo refresh concurrente para evitar race conditions).
- `ProtectedRoute` valida `isAuthenticated` e `isAdmin` antes de renderizar rutas protegidas.

---

## 9. Comunicación en Tiempo Real (SSE)

### Arquitectura SSE Propuesta

```
notification-service (puerto 8001)
        │
        │  EventSource /api/notifications/sse/{userId}/
        ▼
┌─────────────────────────┐
│     useSSE Hook         │
│                         │
│  Evento "notification"  │──▶ refreshUnread() → actualiza badge
│                         │──▶ Si ticket_id === currentTicketId:
│                         │      onRefreshResponses() → recarga respuestas
└─────────────────────────┘
```

**Dos modos de uso:**
1. **Global** (`SSEGlobalListener`): activo en todas las rutas excepto `TicketDetail`. Solo actualiza el badge.
2. **Contextual** (`TicketDetail`): además del badge, recarga las respuestas si el evento es del ticket visible.

---

## 10. Estrategia de Testing

### Organización de Tests

```
src/test/
├── __mocks__/               ← Mocks globales (axios, etc.)
├── setup.ts                 ← Configuración de Vitest + Testing Library
├── auth-security.test.ts    ← Tests de seguridad
├── components/              ← Tests de componentes
├── context/                 ← Tests de providers
├── hooks/                   ← Tests de custom hooks
├── services/                ← Tests de adaptadores
├── pages/                   ← Tests de integración de páginas
├── tickets/                 ← Tests específicos de tickets
├── assignments/             ← Tests de asignaciones
├── navbar/                  ← Tests de navegación
└── notifications/           ← Tests de notificaciones
```

### Tipos de Tests por Capa

| Capa | Tipo de Test | Herramienta |
| :--- | :--- | :--- |
| `domain/` | Unit tests (funciones puras) | Vitest |
| `services/` | Unit tests con mocks de Axios | Vitest |
| `context/` | Tests de providers | Testing Library |
| `hooks/` | Tests de hooks | Testing Library renderHook |
| `components/` | Tests de renderizado e interacción | Testing Library |
| `pages/` | Tests de integración | Testing Library |

---

## 11. Despliegue e Infraestructura

### Build de Producción (Docker Multi-Stage)

```dockerfile
# Stage 1: Build con Node 22
FROM node:22-alpine AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build            # VITE_* vars se inyectan en build time

# Stage 2: Serve con Nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Configuración Nginx

- **Gzip** habilitado para JS, CSS, JSON, SVG.
- **Cache agresivo** para `/assets/` (1 año, inmutable — Vite usa content hashing).
- **SPA fallback**: todas las rutas no-archivo redirigen a `index.html`.

### Variables de Entorno (Build Time)

| Variable | Default | Propósito |
| :--- | :--- | :--- |
| `VITE_TICKET_SERVICE_URL` | `http://localhost:8000/api` | Base URL del Ticket Service |
| `VITE_NOTIFICATION_SERVICE_URL` | `http://localhost:8001/api` | Base URL del Notification Service |
| `VITE_ASSIGNMENT_SERVICE_URL` | `http://localhost:8002/api` | Base URL del Assignment Service |
| `VITE_USERS_SERVICE_URL` | `http://localhost:8003/api` | Base URL del Users Service |
| `VITE_NOTIFICATION_BASE_URL` | `http://localhost:8001` | Base URL para SSE (sin /api) |
