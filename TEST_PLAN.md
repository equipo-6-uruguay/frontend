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
