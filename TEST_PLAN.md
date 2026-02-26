# Plan de Pruebas — Sistema de Tickets (v2)

> **Versión:** 2.0 | **Fecha:** 2026-02-26 | **Issue relacionado:** [#8](https://github.com/equipo-6-uruguay/frontend/issues/8)

---

## Índice

1. [Introducción](#1-introducción)
2. [Alcance](#2-alcance)
3. [Niveles de Prueba](#3-niveles-de-prueba)
4. [Pruebas de Integración — Endpoints REST](#4-pruebas-de-integración--endpoints-rest)
5. [Herramientas](#5-herramientas)
6. [Calendario de Pruebas](#6-calendario-de-pruebas)
7. [Gestión de Riesgos](#7-gestión-de-riesgos)

---

## 1. Introducción

Este documento actualiza el plan de pruebas del taller anterior para el **Sistema de Tickets basado en microservicios**. Incorpora:

- Pruebas de integración para los nuevos endpoints REST de cada microservicio.
- Una sección de Gestión de Riesgos con identificación, probabilidad, impacto y estrategia de mitigación.
- Una estrategia de calidad consolidada que abarca frontend y backend.

### 1.1 Objetivo del Plan

Garantizar que todos los componentes del sistema (frontend React + microservicios Django/DRF) funcionen correcta e íntegramente antes de cada release, minimizando regresiones y protegiendo las reglas de negocio definidas en el dominio.

### 1.2 Audiencia

| Rol | Uso del documento |
|-----|-----------------|
| Desarrolladores | Referencia de cobertura esperada y contratos de prueba |
| QA | Base para diseño de casos de prueba y ejecución |
| Tech Lead | Seguimiento de calidad y gestión de riesgos |

---

## 2. Alcance

### 2.1 En alcance

| Área | Descripción |
|------|-------------|
| **Ticket Service** | Lógica de dominio (estados, transiciones), endpoints REST, publicación de eventos `ticket.created` / `ticket.status_changed` |
| **Assignment Service** | Consumo del evento `ticket.created`, asignación de agentes, endpoint `PATCH /assignments/{id}/assign-user/` |
| **Notification Service** | Consumo de eventos, persistencia de notificaciones, endpoints REST |
| **User Service** | Autenticación JWT, endpoint `GET /auth/by-role/{role}/` |
| **Frontend (React)** | Componentes de UI, hooks, capa de dominio (`src/domain/`), servicios (adaptadores Axios), flujo de autenticación |
| **Integración E2E mínima** | Flujo crítico: registro → login → crear ticket → cambio de estado → notificación recibida |

### 2.2 Fuera de alcance

| Área | Justificación |
|------|--------------|
| Pruebas de carga/estrés | No forma parte del alcance del sprint actual; se planifica para post-MVP |
| Infraestructura (Docker, Nginx) | Cubierto por revisión de configuración; no requiere pruebas automatizadas ahora |
| Base de datos directa | Las pruebas usan bases de datos de prueba aisladas; no se accede a producción |
| Servicios externos de terceros | Sin integraciones externas actualmente |

---

## 3. Niveles de Prueba

### 3.1 Pruebas Unitarias

**Objetivo:** Verificar que las unidades mínimas de código (funciones puras, clases de dominio, hooks) funcionan correctamente de forma aislada.

| Capa | Qué se prueba | Herramienta | Ubicación |
|------|--------------|-------------|-----------|
| Dominio (backend) | Reglas de transición de estado (`TicketAlreadyClosed`, idempotencia), value objects | Pytest | `backend/*/tests/domain/` |
| Dominio (frontend) | `priorityRules.ts`, `priorityUtils.ts` — lógica de cálculo de prioridad | Vitest | `src/test/tickets/` |
| Hooks | `useFetch`, `useSSE`, `useTicketDetail` — comportamiento aislado con mocks | Vitest + RTL | `src/test/hooks/` |
| Componentes UI | Renderizado, estados vacíos, interacciones básicas (sin backend) | Vitest + RTL | `src/test/components/`, `src/components/*/index.test.tsx` |
| Utilidades | `dateFormat.ts` | Vitest | `src/test/` |

**Criterios de éxito:**
- Cobertura mínima del **80 %** en la capa de dominio (frontend y backend).
- Todo caso de dominio crítico (transiciones de estado, reglas de prioridad) debe tener al menos un test positivo y uno negativo.
- Los tests de dominio backend **no deben importar Django** (`django.db`, `models`, etc.).

---

### 3.2 Pruebas de Integración

**Objetivo:** Verificar que los endpoints REST responden correctamente ante peticiones reales o semi-reales (DB de test, sin mocks de red).

> Desarrollado en detalle en la sección [4](#4-pruebas-de-integración--endpoints-rest).

**Criterios de éxito:**
- Cada endpoint documentado en `ARCHITECTURE.md` tiene al menos un caso de prueba de integración.
- Respuestas con el HTTP status correcto para casos felices y de error.
- Las reglas de negocio (ej. no cambiar estado a ticket `CLOSED`) se validan a nivel de integración.

---

### 3.3 Pruebas de Seguridad / Autenticación

**Objetivo:** Garantizar que las rutas protegidas rechazan peticiones sin token válido y que los tokens no se almacenan en `localStorage`.

| Caso | Resultado esperado |
|------|--------------------|
| Petición a `/tickets/` sin JWT | `401 Unauthorized` |
| Petición a `/tickets/{id}/priority/` con rol `user` | `403 Forbidden` |
| Token en `localStorage` estándar | No debe existir (usar HttpOnly cookies) |
| Componente `<ProtectedRoute>` sin sesión activa | Redirige a `/login` |

**Herramienta:** Pytest (backend), Vitest + `auth-security.test.ts` (frontend).

---

### 3.4 Pruebas End-to-End (E2E)

**Objetivo:** Validar el flujo completo crítico del sistema desde el navegador hasta la base de datos.

**Flujo crítico cubierto:**

```
Usuario → Registro → Login → Crear Ticket → Ver Ticket en lista
→ Agente asignado (verificar en Assignments) → Cambiar estado
→ Notificación generada → Marcar notificación como leída
```

**Alcance inicial (sprint actual):**
- Implementación manual del flujo con ambiente de staging.
- Automatización con **Playwright** planificada para el siguiente sprint.

**Criterios de éxito:**
- El flujo crítico completo pasa sin errores.
- No hay errores 500 en la consola del navegador durante el flujo.

---

## 4. Pruebas de Integración — Endpoints REST

Todas las pruebas de integración del backend se ejecutan con **Pytest + Django Test Client** o **DRF APIClient**, sobre una base de datos PostgreSQL de test (`:memory:` o contenedor temporal). Cada prueba verifica el HTTP status, el cuerpo de la respuesta y los efectos secundarios relevantes (eventos publicados, estado en DB).

---

### 4.1 Ticket Service (`/tickets/`)

| # | Endpoint | Método | Caso de prueba | Status esperado |
|---|----------|--------|---------------|-----------------|
| T-01 | `/tickets/` | GET | Listar todos los tickets autenticado | `200 OK` |
| T-02 | `/tickets/` | GET | Acceso sin token | `401 Unauthorized` |
| T-03 | `/tickets/` | POST | Crear ticket válido (título + descripción) → verificar `status="OPEN"` y evento `ticket.created` publicado | `201 Created` |
| T-04 | `/tickets/` | POST | Crear ticket sin título | `400 Bad Request` |
| T-05 | `/tickets/{id}/` | GET | Obtener ticket existente | `200 OK` |
| T-06 | `/tickets/{id}/` | GET | Obtener ticket con ID inexistente | `404 Not Found` |
| T-07 | `/tickets/{id}/` | DELETE | Eliminar ticket existente | `204 No Content` |
| T-08 | `/tickets/{id}/status/` | PATCH | Transición válida `OPEN → IN_PROGRESS` → verificar evento `ticket.status_changed` | `200 OK` |
| T-09 | `/tickets/{id}/status/` | PATCH | Transición inválida sobre ticket `CLOSED` → excepción `TicketAlreadyClosed` | `400 Bad Request` |
| T-10 | `/tickets/{id}/status/` | PATCH | Idempotencia: mismo estado solicitado → sin cambio, sin evento | `200 OK` (sin evento) |
| T-11 | `/tickets/{id}/priority/` | PATCH | Actualizar prioridad con rol admin y justificación | `200 OK` |
| T-12 | `/tickets/{id}/priority/` | PATCH | Actualizar prioridad con rol `user` | `403 Forbidden` |
| T-13 | `/tickets/{id}/responses/` | GET | Listar respuestas de un ticket | `200 OK` |
| T-14 | `/tickets/{id}/responses/` | POST | Agregar respuesta válida | `201 Created` |
| T-15 | `/tickets/{id}/responses/` | POST | Respuesta vacía | `400 Bad Request` |

**Verificaciones adicionales (T-03, T-08):**
```python
# Verificar que el evento se publicó correctamente (mock de RabbitMQ publisher)
mock_publisher.assert_called_once_with(
    exchange="ticket.events",
    routing_key="ticket.created",  # o "ticket.status_changed"
    body={
        "event_type": "ticket.created",
        "ticket_id": <id>,
        "title": "...",
        "user_id": <id>,
        "status": "open",
        "timestamp": "<ISO8601>"
    }
)
```

---

### 4.2 Assignment Service (`/assignments/`)

| # | Endpoint | Método | Caso de prueba | Status esperado |
|---|----------|--------|---------------|-----------------|
| A-01 | `/assignments/` | GET | Listar asignaciones autenticado | `200 OK` |
| A-02 | `/assignments/` | GET | Sin autenticación | `401 Unauthorized` |
| A-03 | `/assignments/{id}/assign-user/` | PATCH | Reasignar agente válido | `200 OK` |
| A-04 | `/assignments/{id}/assign-user/` | PATCH | ID de agente inexistente | `400 Bad Request` |
| A-05 | `/assignments/{id}/` | DELETE | Eliminar asignación existente | `204 No Content` |
| A-06 | `/assignments/{id}/` | DELETE | Eliminar asignación con ID inexistente | `404 Not Found` |
| A-07 | Consumer `ticket.created` | Evento | Al recibir evento válido → asignación creada en DB | Asignación persiste |
| A-08 | Consumer `ticket.created` | Evento | Mensaje malformado (sin `ticket_id`) → no crash, log de error | Consumer sigue vivo |

---

### 4.3 Notification Service (`/notifications/`)

| # | Endpoint | Método | Caso de prueba | Status esperado |
|---|----------|--------|---------------|-----------------|
| N-01 | `/notifications/` | GET | Listar notificaciones del usuario autenticado | `200 OK` |
| N-02 | `/notifications/` | GET | Sin autenticación | `401 Unauthorized` |
| N-03 | `/notifications/{id}/read/` | PATCH | Marcar notificación como leída | `200 OK` |
| N-04 | `/notifications/{id}/read/` | PATCH | ID inexistente | `404 Not Found` |
| N-05 | `/notifications/{id}/` | DELETE | Eliminar notificación | `204 No Content` |
| N-06 | `/notifications/clear/` | DELETE | Limpiar todas las notificaciones del usuario | `204 No Content` |
| N-07 | Consumer `ticket.created` | Evento | Evento recibido → notificación guardada en DB con datos correctos | Notificación persiste |
| N-08 | Consumer | Evento | Procesamiento idempotente (mismo evento duplicado) → sin duplicados | 1 sola notificación |

---

### 4.4 User Service (`/auth/`)

| # | Endpoint | Método | Caso de prueba | Status esperado |
|---|----------|--------|---------------|-----------------|
| U-01 | `/auth/register/` | POST | Registro con datos válidos | `201 Created` |
| U-02 | `/auth/register/` | POST | Email duplicado | `400 Bad Request` |
| U-03 | `/auth/login/` | POST | Credenciales válidas → retorna JWT | `200 OK` |
| U-04 | `/auth/login/` | POST | Contraseña incorrecta | `401 Unauthorized` |
| U-05 | `/auth/by-role/{role}/` | GET | Obtener usuarios por rol `ADMIN` (autenticado) | `200 OK` |
| U-06 | `/auth/by-role/{role}/` | GET | Rol inválido o sin permiso | `403 Forbidden` |
