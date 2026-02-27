# Casos de Prueba en Gherkin — Sistema de Tickets (v2)

> **Versión:** 1.0 | **Fecha:** 2026-02-27 | **Equipo:** Equipo 6 Uruguay

---

## Índice

1. [Módulo: Autenticación](#1-módulo-autenticación)
2. [Módulo: Tickets](#2-módulo-tickets)
3. [Módulo: Detalle de Ticket y Respuestas](#3-módulo-detalle-de-ticket-y-respuestas)
4. [Módulo: Prioridad de Tickets](#4-módulo-prioridad-de-tickets)
5. [Módulo: Asignaciones](#5-módulo-asignaciones)
6. [Módulo: Notificaciones](#6-módulo-notificaciones)
7. [Módulo: Seguridad y Rutas Protegidas](#7-módulo-seguridad-y-rutas-protegidas)
8. [Flujo E2E Crítico](#8-flujo-e2e-crítico)

---

## 1. Módulo: Autenticación

### Feature: Inicio de Sesión

```gherkin
Feature: Inicio de sesión de usuario
  Como usuario del sistema de tickets
  Quiero poder iniciar sesión con mi correo y contraseña
  Para acceder a las funcionalidades del sistema

  Background:
    Given el usuario se encuentra en la página de login

  Scenario: CP-AUTH-01 — Login exitoso con credenciales válidas
    Given el usuario tiene una cuenta registrada con correo "test@test.com" y contraseña "password123"
    When el usuario ingresa "test@test.com" en el campo "Correo electrónico"
    And el usuario ingresa "password123" en el campo "Contraseña"
    And el usuario hace clic en el botón "Iniciar Sesión"
    Then el sistema redirige al usuario a la página "/tickets"
    And el usuario puede ver el listado de tickets

  Scenario: CP-AUTH-02 — Login fallido con credenciales inválidas
    When el usuario ingresa "test@test.com" en el campo "Correo electrónico"
    And el usuario ingresa "wrong" en el campo "Contraseña"
    And el usuario hace clic en el botón "Iniciar Sesión"
    Then el sistema muestra el mensaje de error "Credenciales inválidas"
    And el usuario permanece en la página de login

  Scenario: CP-AUTH-03 — Login fallido muestra error genérico
    Given el servidor responde con un error sin mensaje específico
    When el usuario ingresa "test@test.com" en el campo "Correo electrónico"
    And el usuario ingresa "wrong" en el campo "Contraseña"
    And el usuario hace clic en el botón "Iniciar Sesión"
    Then el sistema muestra el mensaje "Error al iniciar sesión. Intenta nuevamente."

  Scenario: CP-AUTH-04 — Formulario de login muestra campos requeridos
    Then el formulario muestra el campo "Correo electrónico"
    And el formulario muestra el campo "Contraseña"
    And el formulario muestra el botón "Iniciar Sesión"
    And el formulario muestra un enlace a "Crear cuenta nueva"
```

### Feature: Registro de Usuario

```gherkin
Feature: Registro de nuevo usuario
  Como visitante del sistema
  Quiero poder crear una cuenta nueva
  Para acceder al sistema de tickets

  Background:
    Given el usuario se encuentra en la página de registro

  Scenario: CP-AUTH-05 — Registro exitoso con datos válidos
    When el usuario ingresa "newuser" en el campo "Nombre de usuario"
    And el usuario ingresa "new@test.com" en el campo "Correo electrónico"
    And el usuario ingresa "password123" en el campo "Contraseña"
    And el usuario ingresa "password123" en el campo "Confirmar contraseña"
    And el usuario hace clic en el botón "Crear cuenta"
    Then el sistema registra al usuario con username "newuser", email "new@test.com" y password "password123"
    And el sistema redirige al usuario a la página "/tickets"

  Scenario: CP-AUTH-06 — Registro fallido por contraseñas que no coinciden
    When el usuario ingresa "testuser" en el campo "Nombre de usuario"
    And el usuario ingresa "test@test.com" en el campo "Correo electrónico"
    And el usuario ingresa "password123" en el campo "Contraseña"
    And el usuario ingresa "different" en el campo "Confirmar contraseña"
    And el usuario hace clic en el botón "Crear cuenta"
    Then el sistema muestra el mensaje "Las contraseñas no coinciden"
    And el servicio de registro no es invocado

  Scenario: CP-AUTH-07 — Registro fallido por contraseña muy corta
    When el usuario ingresa "testuser" en el campo "Nombre de usuario"
    And el usuario ingresa "test@test.com" en el campo "Correo electrónico"
    And el usuario ingresa "short" en el campo "Contraseña"
    And el usuario ingresa "short" en el campo "Confirmar contraseña"
    And el usuario hace clic en el botón "Crear cuenta"
    Then el sistema muestra el mensaje "La contraseña debe tener al menos 8 caracteres"
    And el servicio de registro no es invocado

  Scenario: CP-AUTH-08 — Registro fallido por email duplicado
    Given ya existe un usuario registrado con el correo "dup@test.com"
    When el usuario ingresa "newuser" en el campo "Nombre de usuario"
    And el usuario ingresa "dup@test.com" en el campo "Correo electrónico"
    And el usuario ingresa "password123" en el campo "Contraseña"
    And el usuario ingresa "password123" en el campo "Confirmar contraseña"
    And el usuario hace clic en el botón "Crear cuenta"
    Then el sistema muestra el mensaje "Email ya registrado"

  Scenario: CP-AUTH-09 — Formulario de registro muestra todos los campos
    Then el formulario muestra el campo "Nombre de usuario"
    And el formulario muestra el campo "Correo electrónico"
    And el formulario muestra el campo "Contraseña"
    And el formulario muestra el campo "Confirmar contraseña"
    And el formulario muestra el botón "Crear cuenta"
    And el formulario muestra un enlace a "Iniciar sesión"
```

---

## 2. Módulo: Tickets

### Feature: Listado de Tickets

```gherkin
Feature: Listado de tickets
  Como usuario autenticado
  Quiero ver la lista de tickets
  Para gestionar las solicitudes del sistema

  Scenario: CP-TKT-01 — Admin ve todos los tickets
    Given el usuario está autenticado como administrador
    And existen 2 tickets en el sistema: "Bug en login" y "Feature request"
    When el usuario navega a la página de listado de tickets
    Then el sistema muestra el título "Panel de Tickets"
    And el sistema muestra el ticket "Bug en login"
    And el sistema muestra el ticket "Feature request"
    And el sistema muestra el contador "2 tickets encontrados"

  Scenario: CP-TKT-02 — Usuario regular solo ve sus propios tickets
    Given el usuario está autenticado como usuario regular con id "user-1"
    And existen tickets de "user-1" y de otros usuarios
    When el usuario navega a la página de listado de tickets
    Then el sistema muestra el título "Mis Tickets"
    And el sistema muestra solo los tickets creados por "user-1"
    And los tickets de otros usuarios no son visibles

  Scenario: CP-TKT-03 — Estado vacío cuando no hay tickets
    Given el usuario está autenticado como administrador
    And no existen tickets en el sistema
    When el usuario navega a la página de listado de tickets
    Then el sistema muestra el mensaje "No hay tickets registrados"

  Scenario: CP-TKT-04 — Estado de carga al iniciar
    Given el usuario está autenticado
    And la API de tickets está respondiendo lentamente
    When el usuario navega a la página de listado de tickets
    Then el sistema muestra el mensaje "Cargando tickets..."

  Scenario: CP-TKT-05 — Manejo de error de API
    Given el usuario está autenticado como administrador
    And la API de tickets responde con un error de red
    When el usuario navega a la página de listado de tickets
    Then el sistema maneja el error sin crashear
    And el mensaje "Cargando tickets..." desaparece
```

### Feature: Creación de Tickets

```gherkin
Feature: Creación de tickets
  Como usuario autenticado
  Quiero poder crear un nuevo ticket
  Para reportar un problema o solicitud

  Scenario: CP-TKT-06 — Formulario de creación muestra campos requeridos
    Given el usuario está autenticado
    When el usuario navega a la página "Crear Nuevo Ticket"
    Then el formulario muestra el campo "Título"
    And el formulario muestra el campo "Descripción"
    And el formulario muestra el botón "Crear Ticket"

  Scenario: CP-TKT-07 — Creación exitosa de ticket
    Given el usuario está autenticado con id "user-1"
    And el usuario se encuentra en la página de creación de ticket
    When el usuario ingresa "Bug" en el campo "Título"
    And el usuario ingresa "Crash" en el campo "Descripción"
    And el usuario hace clic en el botón "Crear Ticket"
    Then el sistema crea el ticket con título "Bug", descripción "Crash" y user_id "user-1"
    And el sistema refresca el conteo de notificaciones no leídas
    And el sistema redirige al usuario a la página "/tickets"

  Scenario: CP-TKT-08 — Error al crear ticket muestra mensaje
    Given el usuario está autenticado
    And la API responde con error "Validation error"
    When el usuario completa el formulario y hace clic en "Crear Ticket"
    Then el sistema muestra el mensaje de error "Validation error"

  Scenario: CP-TKT-09 — Redirige a login si no hay usuario
    Given el usuario no está autenticado (user es null)
    When el usuario intenta crear un ticket
    Then el sistema redirige al usuario a la página "/login"
```

### Feature: Eliminación de Tickets

```gherkin
Feature: Eliminación de tickets
  Como administrador del sistema
  Quiero poder eliminar tickets
  Para mantener el sistema organizado

  Scenario: CP-TKT-10 — Eliminar ticket con confirmación
    Given el usuario está autenticado como administrador
    And existe el ticket "Bug en login" con id 1
    When el usuario hace clic en el botón "Eliminar ticket"
    Then el sistema muestra el modal de confirmación con el mensaje "esta acción no se puede deshacer"
    When el usuario hace clic en el botón "Eliminar" del modal
    Then el sistema elimina el ticket con id 1
```

---

## 3. Módulo: Detalle de Ticket y Respuestas

### Feature: Visualización de Detalle

```gherkin
Feature: Detalle de ticket
  Como usuario autenticado
  Quiero ver el detalle de un ticket
  Para conocer su información completa y respuestas

  Background:
    Given existe un ticket con id 42, título "Bug en el login" y estado "OPEN"

  Scenario: CP-DET-01 — Carga el detalle del ticket por ID de ruta
    Given el usuario está autenticado como creador del ticket
    When el usuario navega a la ruta "/tickets/42"
    Then el sistema realiza la petición getTicket con id 42

  Scenario: CP-DET-02 — Muestra estado de carga
    Given el usuario está autenticado
    And la API está respondiendo lentamente
    When el usuario navega al detalle del ticket
    Then el sistema muestra el indicador de carga

  Scenario: CP-DET-03 — Creador ve las respuestas del ticket
    Given el usuario está autenticado como creador del ticket (user-123)
    And el ticket tiene 2 respuestas: "Estamos revisando tu caso" y "El problema ha sido identificado"
    When el usuario navega al detalle del ticket
    Then el sistema muestra la sección "Respuestas"
    And se muestran las 2 respuestas
    And las respuestas aparecen en orden cronológico ascendente
    And cada respuesta muestra el nombre del admin que la escribió
    And cada respuesta muestra la fecha de creación

  Scenario: CP-DET-04 — Detalle sin respuestas muestra estado vacío
    Given el usuario está autenticado como creador del ticket
    And el ticket no tiene respuestas
    When el usuario navega al detalle del ticket
    Then el sistema muestra el mensaje "Aún no hay respuestas para este ticket"

  Scenario: CP-DET-05 — Usuario no creador y no admin ve acceso restringido
    Given el usuario está autenticado como "user-999" (no es creador ni admin)
    When el usuario navega al detalle del ticket
    Then el sistema no muestra la sección de respuestas
    And el sistema muestra un mensaje de acceso restringido

  Scenario: CP-DET-06 — Admin ve respuestas de cualquier ticket
    Given el usuario está autenticado como administrador (no es el creador)
    And el ticket tiene respuestas existentes
    When el usuario navega al detalle del ticket
    Then el sistema muestra la sección "Respuestas" con todas las respuestas
```

### Feature: Respuestas del Admin (HU-3.2)

```gherkin
Feature: Formulario de respuesta del administrador
  Como administrador del sistema
  Quiero poder responder a los tickets
  Para dar seguimiento a las solicitudes de los usuarios

  Scenario: CP-DET-07 — Admin ve formulario de respuesta en ticket OPEN
    Given el usuario está autenticado como administrador
    And el ticket tiene estado "OPEN"
    When el usuario ve el detalle del ticket
    Then el sistema muestra un textarea con data-testid "response-textarea"
    And el sistema muestra el botón "Responder"
    And el sistema muestra el contador "0 / 2000"

  Scenario: CP-DET-08 — Admin ve formulario de respuesta en ticket IN_PROGRESS
    Given el usuario está autenticado como administrador
    And el ticket tiene estado "IN_PROGRESS"
    When el usuario ve el detalle del ticket
    Then el sistema muestra el formulario de respuesta con botón "Responder"
    And el sistema muestra el contador "0 / 2000"

  Scenario: CP-DET-09 — Usuario regular no ve formulario de respuesta
    Given el usuario está autenticado como usuario regular (rol USER)
    And el ticket tiene estado "OPEN"
    When el usuario ve el detalle del ticket
    Then el sistema no muestra el textarea de respuesta
    And el sistema no muestra el botón "Responder"

  Scenario: CP-DET-10 — Admin no ve formulario en ticket CLOSED
    Given el usuario está autenticado como administrador
    And el ticket tiene estado "CLOSED"
    When el usuario ve el detalle del ticket
    Then el sistema no muestra el textarea de respuesta
    And el sistema no muestra el botón "Responder"
    And el sistema muestra un aviso de "ticket cerrado" o "no se pueden añadir más respuestas"

  Scenario: CP-DET-11 — Botón Responder deshabilitado con textarea vacío
    Given el usuario está autenticado como administrador
    And el ticket tiene estado "OPEN"
    When el usuario ve el detalle del ticket
    Then el botón "Responder" está deshabilitado

  Scenario: CP-DET-12 — Botón Responder se habilita al escribir texto
    Given el usuario está autenticado como administrador
    And el ticket tiene estado "OPEN"
    When el usuario escribe "Una respuesta válida" en el textarea
    Then el botón "Responder" se habilita

  Scenario: CP-DET-13 — Botón se deshabilita si se borra el texto
    Given el usuario está autenticado como administrador
    And el usuario ha escrito texto en el textarea
    When el usuario borra todo el texto del textarea
    Then el botón "Responder" se deshabilita nuevamente

  Scenario: CP-DET-14 — Contador de caracteres se actualiza al escribir
    Given el usuario está autenticado como administrador
    And el ticket tiene estado "OPEN"
    When el usuario escribe "Hola" en el textarea
    Then el sistema muestra el contador "4 / 2000"

  Scenario: CP-DET-15 — Textarea tiene límite de 2000 caracteres
    Given el usuario está autenticado como administrador
    When el usuario ve el formulario de respuesta
    Then el textarea tiene un atributo maxLength de 2000

  Scenario: CP-DET-16 — Contador muestra "2000 / 2000" al alcanzar el límite
    Given el usuario está autenticado como administrador
    When el usuario escribe 2000 caracteres en el textarea
    Then el sistema muestra el contador "2000 / 2000"

  Scenario: CP-DET-17 — Envío exitoso de respuesta
    Given el usuario está autenticado como administrador con id "admin-001"
    And el ticket tiene estado "OPEN" con id 42
    When el usuario escribe "Esta es la nueva respuesta del admin" en el textarea
    And el usuario hace clic en el botón "Responder"
    Then el sistema llama a createResponse con ticketId 42 y el texto de la respuesta
    And la nueva respuesta aparece en la lista de respuestas
    And el textarea se limpia
    And el contador vuelve a "0 / 2000"
    And el sistema muestra un Toast de confirmación "Respuesta enviada"

  Scenario: CP-DET-18 — Error al enviar respuesta muestra Toast de error
    Given el usuario está autenticado como administrador
    And la API responde con error al crear la respuesta
    When el usuario escribe una respuesta y hace clic en "Responder"
    Then el sistema muestra un Toast con mensaje de error
    And el textarea conserva el texto escrito
```

---

## 4. Módulo: Prioridad de Tickets

### Feature: Visualización de Prioridad (HU-1.2)

```gherkin
Feature: Visualización de prioridad en el detalle del ticket
  Como usuario del sistema
  Quiero ver la prioridad asignada a un ticket
  Para entender su nivel de urgencia

  Scenario: CP-PRI-01 — Prioridad "High" se muestra como "Alta"
    Given existe un ticket con prioridad "High"
    When el usuario ve el detalle del ticket
    Then el sistema muestra la prioridad como "Alta"

  Scenario: CP-PRI-02 — Prioridad "Medium" se muestra como "Media"
    Given existe un ticket con prioridad "Medium"
    When el usuario ve el detalle del ticket
    Then el sistema muestra la prioridad como "Media"

  Scenario: CP-PRI-03 — Prioridad "Low" se muestra como "Baja"
    Given existe un ticket con prioridad "Low"
    When el usuario ve el detalle del ticket
    Then el sistema muestra la prioridad como "Baja"

  Scenario: CP-PRI-04 — Sin prioridad se muestra como "Unassigned"
    Given existe un ticket sin prioridad asignada
    When el usuario ve el detalle del ticket
    Then el sistema muestra la prioridad como "Unassigned"
```

### Feature: Gestión Manual de Prioridad por Admin (HU-2.x)

```gherkin
Feature: Gestión manual de prioridad
  Como administrador del sistema
  Quiero poder cambiar la prioridad de un ticket
  Para priorizar la atención de las solicitudes

  Scenario: CP-PRI-05 — Admin cambia prioridad de OPEN a HIGH
    Given el usuario está autenticado como administrador
    And existe un ticket OPEN con prioridad "Unassigned"
    When el admin selecciona la prioridad "High" en el selector
    And hace clic en el botón "Guardar"
    Then el sistema llama a updatePriority con id 42 y prioridad "High"
    And la UI se actualiza con la nueva prioridad

  Scenario: CP-PRI-06 — Admin recibe callback onUpdate tras cambio exitoso
    Given el usuario está autenticado como administrador
    And existe un ticket OPEN con prioridad "Unassigned"
    When el admin cambia la prioridad a "High" y guarda
    Then el callback onUpdate se invoca con el ticket actualizado (prioridad "High")

  Scenario: CP-PRI-07 — No se puede volver a UNASSIGNED desde MEDIUM
    Given el usuario está autenticado como administrador
    And existe un ticket con prioridad "Medium"
    When el admin intenta seleccionar "Unassigned"
    Then la opción "Unassigned" no está disponible en el selector

  Scenario: CP-PRI-08 — Forzar UNASSIGNED no invoca la API
    Given el usuario está autenticado como administrador
    And existe un ticket con prioridad "Medium"
    When el admin intenta forzar el valor "Unassigned" programáticamente
    And hace clic en el botón "Guardar"
    Then el sistema no invoca updatePriority

  Scenario: CP-PRI-09 — Usuario regular no ve control de prioridad
    Given el usuario está autenticado como usuario regular (rol USER)
    And existe un ticket OPEN con prioridad "Unassigned"
    When el usuario ve el detalle del ticket
    Then el control de selección de prioridad no es visible

  Scenario: CP-PRI-10 — Usuario no autenticado no ve control de prioridad
    Given el usuario no está autenticado
    When el usuario intenta ver el detalle del ticket
    Then el control de selección de prioridad no es visible

  Scenario: CP-PRI-11 — Ticket CLOSED bloquea cambio de prioridad
    Given el usuario está autenticado como administrador
    And existe un ticket con estado "CLOSED" y prioridad "Low"
    When el usuario ve el detalle del ticket
    Then el control de selección de prioridad no es visible

  Scenario: CP-PRI-12 — Ticket CLOSED no invoca API de prioridad
    Given el usuario está autenticado como administrador
    And existe un ticket con estado "CLOSED"
    When se intenta cambiar la prioridad programáticamente
    Then el sistema no invoca updatePriority
```

---

## 5. Módulo: Asignaciones

### Feature: Listado de Asignaciones

```gherkin
Feature: Listado de asignaciones de tickets
  Como administrador del sistema
  Quiero ver la lista de asignaciones
  Para gestionar qué agentes atienden cada ticket

  Scenario: CP-ASG-01 — Estado de carga al iniciar
    Given la API de asignaciones está respondiendo lentamente
    When el usuario navega a la página de asignaciones
    Then el sistema muestra el indicador de carga

  Scenario: CP-ASG-02 — Muestra título del ticket en la tarjeta
    Given existen 2 asignaciones para los tickets "Error en login" (#100) y "Pérdida de datos" (#101)
    When el usuario navega a la página de asignaciones
    Then el sistema muestra "Error en login" en la tarjeta
    And el sistema muestra "Pérdida de datos" en la tarjeta

  Scenario: CP-ASG-03 — Muestra badge con ID del ticket
    Given existen asignaciones para los tickets #100 y #101
    When el usuario navega a la página de asignaciones
    Then el sistema muestra el badge "#100"
    And el sistema muestra el badge "#101"

  Scenario: CP-ASG-04 — Muestra prioridad en español
    Given existen asignaciones con prioridades "HIGH" y "MEDIUM"
    When el usuario navega a la página de asignaciones
    Then el sistema muestra "Alta" para la prioridad HIGH
    And el sistema muestra "Media" para la prioridad MEDIUM

  Scenario: CP-ASG-05 — Muestra nombre del agente asignado
    Given existe una asignación con agente "carlos.gomez"
    When el usuario navega a la página de asignaciones
    Then el sistema muestra "Asignación: carlos.gomez"

  Scenario: CP-ASG-06 — Muestra "No asignado" sin agente
    Given existe una asignación sin agente asignado
    When el usuario navega a la página de asignaciones
    Then el sistema muestra "No asignado"

  Scenario: CP-ASG-07 — Estado vacío sin asignaciones
    Given no existen asignaciones en el sistema
    When el usuario navega a la página de asignaciones
    Then el sistema muestra el estado vacío

  Scenario: CP-ASG-08 — Contador de tareas en el header
    Given existen 2 asignaciones
    When el usuario navega a la página de asignaciones
    Then el header muestra "2 tareas"

  Scenario: CP-ASG-09 — Manejo de error de API de asignaciones
    Given la API de asignaciones responde con un error
    When el usuario navega a la página de asignaciones
    Then el sistema maneja el error sin crashear

  Scenario: CP-ASG-10 — El sistema funciona si el servicio de usuarios falla
    Given la API de asignaciones responde correctamente
    And la API de usuarios responde con error
    When el usuario navega a la página de asignaciones
    Then el sistema muestra los tickets aunque no se resuelva el nombre del agente
```

---

## 6. Módulo: Notificaciones

### Feature: Listado de Notificaciones

```gherkin
Feature: Listado de notificaciones
  Como usuario autenticado
  Quiero ver mis notificaciones
  Para estar informado sobre cambios en los tickets

  Scenario: CP-NOT-01 — Estado de carga al iniciar
    Given la API de notificaciones está respondiendo lentamente
    When el usuario navega a la página de notificaciones
    Then el sistema muestra el indicador de carga

  Scenario: CP-NOT-02 — Muestra notificaciones tras cargar
    Given existen 2 notificaciones: "New ticket assigned" y "Ticket status changed"
    When el usuario navega a la página de notificaciones
    Then el sistema muestra "New ticket assigned"
    And el sistema muestra "Ticket status changed"

  Scenario: CP-NOT-03 — Estado vacío sin notificaciones
    Given el usuario no tiene notificaciones
    When el usuario navega a la página de notificaciones
    Then el sistema muestra el estado vacío

  Scenario: CP-NOT-04 — Contador de notificaciones en el header
    Given existen 2 notificaciones
    When el usuario navega a la página de notificaciones
    Then el header muestra "2 mensajes"

  Scenario: CP-NOT-05 — Manejo de error de API
    Given la API de notificaciones responde con un error
    When el usuario navega a la página de notificaciones
    Then el sistema muestra el estado vacío (fallback)
    And el sistema no crashea
```

---

## 7. Módulo: Seguridad y Rutas Protegidas

### Feature: Rutas Protegidas

```gherkin
Feature: Protección de rutas
  Como sistema de tickets
  Quiero proteger las rutas privadas
  Para que solo usuarios autenticados accedan a ellas

  Scenario: CP-SEC-01 — Muestra loading mientras verifica autenticación
    Given el proceso de autenticación está en curso (loading = true)
    When el usuario intenta acceder a una ruta protegida
    Then el sistema muestra el mensaje "Cargando..."
    And el contenido protegido no es visible

  Scenario: CP-SEC-02 — Redirige a /login si no está autenticado
    Given el usuario no está autenticado
    When el usuario intenta acceder a una ruta protegida
    Then el sistema redirige al usuario a "/login"
    And el contenido protegido no es visible

  Scenario: CP-SEC-03 — Usuario autenticado accede al contenido
    Given el usuario está autenticado con rol "USER"
    When el usuario accede a una ruta protegida
    Then el contenido protegido es visible

  Scenario: CP-SEC-04 — Usuario no admin redirigido en ruta de admin
    Given el usuario está autenticado con rol "USER"
    And la ruta requiere rol de administrador (requireAdmin = true)
    When el usuario intenta acceder a la ruta
    Then el sistema redirige al usuario a "/tickets"
    And el contenido protegido no es visible

  Scenario: CP-SEC-05 — Admin accede a ruta de administrador
    Given el usuario está autenticado con rol "ADMIN"
    And la ruta requiere rol de administrador (requireAdmin = true)
    When el usuario accede a la ruta
    Then el contenido protegido es visible
```

### Feature: Seguridad de Cookies

```gherkin
Feature: Configuración de seguridad HTTP
  Como sistema seguro
  Quiero que todos los clientes HTTP envíen cookies
  Para usar tokens JWT en cookies HttpOnly

  Scenario: CP-SEC-06 — ticketApiClient usa withCredentials
    Given la aplicación está configurada
    Then el cliente HTTP de tickets tiene withCredentials activado

  Scenario: CP-SEC-07 — notificationApiClient usa withCredentials
    Given la aplicación está configurada
    Then el cliente HTTP de notificaciones tiene withCredentials activado

  Scenario: CP-SEC-08 — assignmentApiClient usa withCredentials
    Given la aplicación está configurada
    Then el cliente HTTP de asignaciones tiene withCredentials activado

  Scenario: CP-SEC-09 — usersApiClient usa withCredentials
    Given la aplicación está configurada
    Then el cliente HTTP de usuarios tiene withCredentials activado
```

---

## 8. Flujo E2E Crítico

### Feature: Flujo Completo del Sistema

```gherkin
Feature: Flujo crítico end-to-end
  Como usuario del sistema
  Quiero completar el flujo completo desde el registro hasta la notificación
  Para verificar que todas las piezas del sistema funcionan integradas

  Scenario: CP-E2E-01 — Flujo completo: registro → login → crear ticket → ver ticket → notificación
    Given el sistema está en funcionamiento con todos los microservicios
    When un nuevo usuario se registra con nombre "e2euser", email "e2e@test.com" y contraseña "password123"
    Then el sistema redirige al usuario a la página de tickets

    When el usuario crea un ticket con título "Problema E2E" y descripción "Test de flujo completo"
    Then el ticket aparece en la lista de tickets con estado "OPEN"
    And se genera una asignación automática para el ticket

    When un administrador navega al detalle del ticket
    And el administrador cambia el estado del ticket a "IN_PROGRESS"
    Then el sistema genera una notificación de cambio de estado
    And la notificación aparece en la lista de notificaciones del usuario

    When el administrador responde al ticket con "Estamos trabajando en tu solicitud"
    Then la respuesta aparece en la sección de respuestas del ticket

    When el administrador marca la notificación como leída
    Then la notificación cambia su estado a "leída"
```
