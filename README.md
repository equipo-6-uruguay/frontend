# Sistema de Tickets - Frontend

Frontend del sistema de tickets construido con React, TypeScript y Vite.

## 🚀 Tecnologías

- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router v7** - Navegación
- **Axios** - Cliente HTTP

## 📁 Estructura
# Sistema de Tickets — Frontend

Frontend del sistema de tickets construido con React, TypeScript y Vite.

## Descripción

Esta aplicación es la interfaz cliente del sistema de gestión de tickets. Proporciona autenticación, listado y detalle de tickets, notificaciones en tiempo real y gestión de asignaciones.

## Tecnologías

- React 19
- TypeScript
- Vite
- React Router v7
- Axios

## Requisitos

- Node.js 18+ (recomendado)
- npm 9+ o yarn/pnpm

## Instalación

1. Clonar el repositorio y entrar en la carpeta `frontend`.
2. Instalar dependencias:

```bash
npm install
# or
pnpm install
```

## Scripts disponibles (desde `package.json`)

- `npm run dev` — Inicia el servidor de desarrollo (Vite).
- `npm run build` — Compila TypeScript y genera la build con Vite.
- `npm run preview` — Previsualiza la build generada.
- `npm run test` — Ejecuta tests con Vitest.
- `npm run test:watch` — Ejecuta tests en modo watch.
- `npm run lint` — Ejecuta ESLint en el proyecto.

Ejemplo rápido:

```bash
npm run dev
```

## Estructura del proyecto (resumen)

```text
src/
├─ assets/               # Imágenes, fuentes y recursos estáticos
├─ components/           # Componentes reutilizables y comunes
│  └─ common/            # Componentes de uso general (LoadingState, EmptyState...)
├─ context/              # Contextos React (Auth, Notificaciones)
├─ hooks/                # Hooks personalizados (useFetchOnce, useSSE)
├─ pages/                # Vistas: auth, tickets, navbar, notifications, assignments
├─ routes/               # Router y rutas de la app
├─ services/             # Clientes API (axios), lógica de servicios
├─ styles/               # CSS global
└─ test/                 # Tests unitarios y mocks
```

## Rutas principales

- `/login` — Inicio de sesión
- `/register` — Registro de usuario
- `/tickets` — Lista de tickets
- `/tickets/new` — Crear ticket
- `/tickets/:id` — Detalle de ticket
- `/notifications` — Notificaciones
- `/assignments` — Asignaciones

## Tests

Se usa Vitest junto con Testing Library. Ejecuta:

```bash
npm run test
```

Para ejecutar en modo desarrollo (watch):

```bash
npm run test:watch
```

## Lint

```bash
npm run lint
```

## Contribuir

1. Crea una rama con un nombre descriptivo.
2. Asegúrate de que los tests pasan y de ejecutar el linter.
3. Abre un Pull Request describiendo los cambios.

## Contacto

Para dudas o integraciones con el backend, contacta con el equipo responsable del repo.

---

Archivo actualizado automáticamente: `README.md`
