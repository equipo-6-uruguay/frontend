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
