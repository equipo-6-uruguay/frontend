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

---

## 5. Herramientas

### 5.1 Backend

| Herramienta | Propósito | Versión |
|-------------|-----------|---------|
| **Pytest** | Framework principal de pruebas unitarias e integración | `≥ 7.x` |
| **pytest-django** | Plugin para integración con Django (configuración de DB de test, fixtures) | `≥ 4.x` |
| **pytest-cov** | Reporte de cobertura de código | `≥ 4.x` |
| **factory_boy** | Creación de fixtures / objetos de test (evitar fixtures estáticas) | `≥ 3.x` |
| **unittest.mock** | Mock de publicador RabbitMQ y dependencias externas (stdlib) | stdlib |
| **DRF APIClient** | Cliente HTTP real sobre Django RequestFactory para tests de integración | incluido en DRF |

**Configuración recomendada (`pytest.ini` / `pyproject.toml`):**
```toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "core.settings.test"
python_files = "tests.py test_*.py *_test.py"
addopts = "--cov=. --cov-report=term-missing --cov-fail-under=80"
```

---

### 5.2 Frontend

| Herramienta | Propósito | Versión |
|-------------|-----------|---------|
| **Vitest** | Runner de pruebas (compatible con Vite, sin config extra) | `^1.0.0` |
| **@testing-library/react** | Renderizado y queries de componentes en jsdom | `^16.x` |
| **@testing-library/user-event** | Simulación de interacciones de usuario (click, type) | `^14.x` |
| **@testing-library/jest-dom** | Matchers extra (`toBeInTheDocument`, `toHaveValue`) | `^6.x` |
| **jsdom** | Entorno DOM simulado para tests fuera del navegador | `^22.x` |
| **MSW (Mock Service Worker)** | Intercepción de peticiones HTTP — candidato para integración (no instalado aún) | `≥ 2.x` |
| **Playwright** | E2E automatizado — planificado para siguiente sprint | `≥ 1.x` |

**Configuración actual (`vite.config.ts`):**
```ts
test: {
  environment: "jsdom",
  setupFiles: "./src/test/setup.ts",
  globals: true
}
```

---

### 5.3 CI/CD

| Herramienta | Propósito |
|-------------|-----------|
| **GitHub Actions** | Ejecución automática de la suite de pruebas en cada PR hacia `develop` o `main` |
| Reportes de cobertura | Artefacto generado por `pytest-cov` y Vitest (`--coverage`) publicado en el PR |

**Pipeline sugerido (`.github/workflows/ci.yml`):**
```
on: [pull_request]
jobs:
  backend-tests: pytest --cov
  frontend-tests: vitest run --coverage
```

---

## 6. Calendario de Pruebas

> Las fechas están alineadas al ciclo del Taller / Sprint actual. Ajustar según planning de equipo.

| Fase | Actividades | Responsable | Fecha estimada |
|------|-------------|-------------|----------------|
| **Fase 1 — Baseline** | Revisar tests existentes, corregir tests rotos, garantizar suite verde en develop | Todo el equipo | 24 Feb — 28 Feb 2026 |
| **Fase 2 — Integración backend** | Implementar casos de integración T-01..T-15, A-01..A-08, N-01..N-08, U-01..U-06 | Backend | 28 Feb — 07 Mar 2026 |
| **Fase 3 — Seguridad frontend** | Completar `auth-security.test.ts`, validar `ProtectedRoute`, revisar almacenamiento de tokens | Frontend | 28 Feb — 05 Mar 2026 |
| **Fase 4 — Revisión de cobertura** | Medir cobertura global, cerrar gaps hasta ≥ 80 % en dominio | Todo el equipo | 07 Mar — 10 Mar 2026 |
| **Fase 5 — E2E manual** | Ejecutar flujo crítico en ambiente de staging, registrar evidencias | QA | 10 Mar — 12 Mar 2026 |
| **Fase 6 — Documentación y entrega** | Actualizar plan con resultados reales, preparar entrega del taller | Tech Lead / QA | 12 Mar — 14 Mar 2026 |
| **Fase 7 — E2E automatizado (next sprint)** | Configurar Playwright, automatizar flujo crítico | Frontend | Sprint siguiente |

### 6.1 Criterios de salida (Definition of Done — Testing)

- [ ] Suite de tests verde (`0 failures`) en la rama antes del merge.
- [ ] Cobertura de dominio ≥ 80 % (backend y frontend).
- [ ] Todos los casos de integración de la tabla 4.x ejecutados y pasando.
- [ ] Flujo E2E crítico ejecutado manualmente sin errores.
- [ ] `TEST_PLAN.md` actualizado con resultados reales post-ejecución.

---

## 7. Gestión de Riesgos

### 7.1 Matriz de Riesgos

> **Probabilidad:** Alta (A) | Media (M) | Baja (B)  
> **Impacto:** Alto (A) | Medio (M) | Bajo (B)  
> **Nivel de riesgo:** Crítico (P×I = AA) | Alto (AM/MA) | Medio (MM/AB/BA) | Bajo (BB)

| ID | Riesgo | Probabilidad | Impacto | Nivel | Estrategia de Mitigación |
|----|--------|:---:|:---:|:---:|--------------------------|
| R-01 | **Baja cobertura de tests en servicios de backend** — Assignment y Notification Service tienen poca cobertura de dominio | A | A | **Crítico** | Sprint dedicado a tests de integración (Fase 2). Bloquear merge si cobertura < 80 % mediante CI. |
| R-02 | **Consumidores RabbitMQ sin manejo de errores robusto** — Mensajes malformados pueden crashear el consumer | A | A | **Crítico** | Agregar `try/except` alrededor de todo el handler (ver instrucciones RabbitMQ). Pruebas A-08 / N-08. Reconnect automático. |
| R-03 | **Tokens JWT almacenados en `localStorage`** — Vulnerabilidad XSS que expone credenciales | M | A | **Alto** | Migrar a HttpOnly cookies (`auth-security.test.ts`). Bloquear PR si el test falla. |
| R-04 | **Acoplamiento de servicios a través de base de datos** — Un servicio podría importar modelos de otro | B | A | **Alto** | Lint personalizado para detectar imports cruzados de modelos. Revisión obligatoria de PRs. |
| R-05 | **Inconsistencia en contratos de eventos** — Un cambio en `ticket.created` sin actualizar consumers rompe la integración | M | A | **Alto** | Documentar contratos en `copilot-instructions.md`. Tests de consumer con payload versionado. |
| R-06 | **Deuda técnica acumulada en código duplicado** (~90 % setup RabbitMQ) — Bugs en un consumer no se propagan a la abstracción del otro | A | M | **Alto** | Refactorizar hacia `BaseRabbitMQConsumer` (identificado en `DEUDA_TECNICA.md`). Planificar en próximo sprint. |
| R-07 | **Falta de pruebas E2E automatizadas** — Regresiones en flujos críticos no detectadas automáticamente | A | M | **Alto** | Implementar Playwright en Fase 7. Mientras tanto: E2E manual obligatorio en staging antes de cada release. |
| R-08 | **Títulos o descripciones de tickets vacíos en frontend** — Validación solo en backend; UX confusa | M | M | **Medio** | Agregar validación de formulario en `TicketForm.tsx`. Test en `src/test/components/`. |
| R-09 | **Variables de entorno no configuradas en CI** — Secrets faltantes causan fallos en pipeline | M | M | **Medio** | Documentar todas las variables en `.env.example`. Revisar secrets de GitHub Actions antes de cada sprint. |
| R-10 | **Falta de manejo de errores HTTP en el frontend** — `useFetch` puede ignorar silenciosamente errores 4xx/5xx | M | M | **Medio** | Revisar y actualizar `useFetch.ts` para lanzar excepciones en error responses. Error boundaries globales activos. |
| R-11 | **Tests flaky por dependencia de tiempo** — Tests de `dateFormat.ts` o timers asíncronos fallan intermitentemente | B | M | **Medio** | Usar `vi.useFakeTimers()` y fixtures de fecha fija en todos los tests de fecha. |
| R-12 | **Desincronización de versiones de Docker entre dev y CI** — Comportamiento diferente entre entornos | B | B | **Bajo** | Fijar versiones en `docker-compose.yml` y `Dockerfile`. Revisar en cada release. |

---

### 7.2 Riesgos Críticos — Detalle y Plan de Acción

#### R-01: Baja cobertura de tests en backend

```
Estado actual : Assignment Service y Notification Service sin tests de dominio
Impacto       : Regresiones silenciosas en lógica de negocio
Acción        : Completar pruebas de integración (Tablas 4.2 y 4.3) antes del 07-Mar-2026
Owner         : Equipo Backend
```

#### R-02: Consumidores RabbitMQ sin manejo de errores robusto

```
Estado actual : Consumers con try/except incompleto; sin reconnect automático
Impacto       : El sistema de asignación y notificación puede dejar de procesar eventos ante un error
Acción        : Implementar BaseRabbitMQConsumer con retry logic; tests A-08 y N-08 deben pasar
Owner         : Equipo Backend
```

#### R-03: Tokens JWT en localStorage

```
Estado actual : Posible almacenamiento en localStorage (detectado en auditoría)
Impacto       : XSS puede robar sesiones de todos los usuarios
Acción        : Migrar a HttpOnly cookies; auth-security.test.ts debe validar ausencia en localStorage
Owner         : Equipo Frontend
```

---

### 7.3 Proceso de Revisión de Riesgos

- Los riesgos se revisan al inicio de cada sprint.
- Un riesgo se cierra cuando su estrategia de mitigación está implementada y validada por tests.
- Nuevos riesgos identificados durante el desarrollo se agregan a esta tabla con commit en la misma rama.
- El Tech Lead es responsable de mantener actualizada esta sección.
