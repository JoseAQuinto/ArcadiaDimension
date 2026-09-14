<div align="center">

<img src="public/favicon.svg" width="72" height="72" alt="ArcadiaDimension" />

# ArcadiaDimension

### Visual Warehouse Designer

Diseña, visualiza y gestiona la distribución física de tus almacenes desde un editor gráfico interactivo.

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Konva](https://img.shields.io/badge/Konva-10-0d83cd)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00e699?logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

<br />

<img src="docs/demo-floor-plan.svg" width="860" alt="Plano del almacén de demostración: zonas, racks coloreados por ocupación, muelles, puertas y columnas" />

<sub>Almacén de demostración (<code>database/demo.sql</code>): zonas funcionales, racks coloreados según su ocupación, muelles, puertas y columnas.</sub>

</div>

---

## Qué es

**ArcadiaDimension** es una aplicación web empresarial para diseñar almacenes de forma visual, al estilo de una herramienta CAD ligera o de un editor como Figma, pero centrada en la logística: zonas funcionales, racks con ubicaciones, muelles, puertas y obstáculos colocados sobre un plano a escala real.

No es un WMS tradicional. Es un **Visual Warehouse Designer**, la base de un futuro _digital twin_ del almacén: el plano es el centro de la aplicación y la información logística (ubicaciones, contenido y ocupación) se representa directamente sobre él.

## Objetivo

Proyecto de portfolio que demuestra:

- **Frontend avanzado**: canvas interactivo con drag & drop, resize, rotación, zoom, pan, snap a cuadrícula y coordenadas métricas.
- **Estado complejo**: historial de deshacer/rehacer, ediciones agrupadas, guardado automático y resolución de conflictos.
- **Arquitectura full-stack** preparada para despliegue serverless (Vercel + Neon).
- **Experiencia de usuario cuidada**: atajos de teclado, tooltips, estados vacíos, confirmaciones, _feedback_ de guardado y accesibilidad.

## Funcionalidades

### Editor visual

- Canvas **react-konva** con plano a escala (1 m = 10 px al 100 %), cuadrícula mayor/menor y cotas del plano.
- Elementos: **zona**, **rack**, **muelle**, **puerta** y **obstáculo**, cada uno con su representación gráfica.
- **Drag & drop** desde la paleta al plano, o clic para añadir en el centro de la vista.
- **Mover** con snap a cuadrícula (0,5 / 1 / 2 / 5 m) y restricción a los límites del plano.
- **Redimensionar** y **rotar** con `Transformer` (rotación libre con imanes cada 45°); la etiqueta del rack se recoloca en vivo.
- **Duplicar** (`Ctrl+D`), **copiar/pegar**, **eliminar** con opción de deshacer desde la notificación y desplazamiento fino con flechas.
- **Deshacer/rehacer** (`Ctrl+Z` / `Ctrl+Y`) con etiquetas descriptivas ("Deshacer: Rotar Rack A").
- **Zoom** con botones, presets, `Ctrl + rueda` centrado en el cursor y ajuste a pantalla con animación. **Pan** arrastrando el fondo o con la rueda.
- **Panel de propiedades**: nombre, tipo, color, X, Y, ancho, alto y rotación. Los campos numéricos admiten teclado, flechas y _scrubbing_ (arrastrar sobre la etiqueta, como en Figma).
- **Capas**: listado filtrable de elementos; al seleccionar uno, la vista se centra en él.
- **Guardado automático** con _debounce_, indicador de estado (_sin guardar_, _guardando_, _guardado_, _error_), reintento automático y aviso al cerrar con cambios pendientes.

### Lógica de almacén

- Racks con **filas (niveles)** × **columnas (huecos)** y código propio. Las ubicaciones se generan automáticamente: `A-01-01`, `A-01-02`…
- Diálogo de **ubicaciones** (doble clic en el rack o `Enter`) con vista frontal del rack y navegación con flechas.
- **Contenido** por ubicación: artículo, descripción, cantidad y lote.
- **Mapa de ocupación**: cada hueco del rack se colorea según sus niveles ocupados (0–50 % verde, 51–80 % ámbar, 81–100 % rojo) y el rack muestra su porcentaje.
- **Buscador** de artículos, descripciones, lotes o códigos de ubicación. Resalta y atenúa el resto del plano; al elegir un resultado se centra el rack correspondiente o se abre la ubicación.
- No se puede reducir un rack por debajo de las ubicaciones con stock. Eliminar un rack con stock y deshacer lo restaura **con su contenido**.

### Aplicación

- **Autenticación** con registro, login, sesión JWT en cookie `httpOnly` y acceso con cuenta demo.
- **Dashboard** con tarjetas de almacén, miniatura SVG del plano, métricas (superficie, racks, ubicaciones, ocupación) y creación, edición o eliminación con confirmación.
- **Concurrencia optimista**: si el plano cambia en otra pestaña o sesión, el editor avisa y permite recargar sin sobrescribir datos.
- Diseño _desktop-first_ (≥ 1280 px); en pantallas pequeñas se muestra un aviso.

### Atajos de teclado

| Acción | Atajo |
| --- | --- |
| Deshacer / rehacer | `Ctrl+Z` / `Ctrl+Y` · `Ctrl+Shift+Z` |
| Duplicar · copiar · pegar | `Ctrl+D` · `Ctrl+C` · `Ctrl+V` |
| Eliminar | `Supr` / `Retroceso` |
| Rotar ±90° | `R` / `Shift+R` |
| Mover 10 cm / una celda | Flechas / `Shift` + flechas |
| Zoom · ajustar a pantalla | `Ctrl` + rueda · `Ctrl +` / `Ctrl −` · `Ctrl+0` |
| Cuadrícula · snap · ocupación | `G` · `S` · `O` |
| Buscar | `Ctrl+F` o `/` |
| Ver ubicaciones del rack | `Enter` o doble clic |
| Ayuda de atajos | `?` |

## Stack

| Capa | Tecnologías |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, react-konva / Konva, Zustand, TanStack Query, React Router, Radix UI, Lucide |
| Backend | Node.js, Fastify 5, Zod, Drizzle ORM, `pg`, `jose` (JWT), `bcryptjs` |
| Base de datos | PostgreSQL (Neon) |
| Calidad | ESLint, Prettier, Vitest (unitarios + integración de API) |
| Despliegue | Vercel (SPA estática + función serverless Node.js) |

## Arquitectura

```mermaid
flowchart LR
  subgraph Browser["Navegador · React SPA"]
    UI["Dashboard y editor"] --> RQ["TanStack Query<br/>estado del servidor"]
    UI --> ZS["Zustand<br/>estado del editor e historial"]
    UI --> KV["react-konva<br/>canvas"]
  end
  RQ -- "fetch /api/* · cookie httpOnly" --> FN
  subgraph Vercel
    ST["Estáticos · dist/"]
    FN["Función serverless · api/index.ts<br/>Fastify + Zod + Drizzle"]
  end
  FN -- "pg · pool + SSL" --> DB[("Neon PostgreSQL")]
```

**Decisiones principales**

- **Un único repositorio y un único paquete**. Vite genera la SPA en `dist/` y `api/index.ts` expone la aplicación Fastify como **una sola función serverless**. `vercel.json` redirige `/api/*` a esa función y el resto a `index.html`. En local, la misma app Fastify se ejecuta como servidor (`server/dev.ts`) detrás del proxy de Vite.
- **Código compartido** (`shared/`): los esquemas Zod, los tipos del dominio y la generación de códigos de ubicación se usan en el frontend y en el backend, así la validación nunca se duplica ni se desincroniza.
- **Separación de estado**: TanStack Query gestiona datos del servidor (almacenes, ocupación, ubicaciones, búsqueda); Zustand gestiona el estado de edición (elementos, selección, viewport, preferencias, historial y estado de guardado).
- **Guardado del plano atómico**. El editor envía el plano completo (`PUT /layout`) tras un _debounce_ de 800 ms y nunca durante un arrastre. El servidor calcula el **diff mínimo** (función pura con tests), escribe en una transacción y regenera solo las ubicaciones de los racks cuya rejilla cambió. Una sola petición mantiene el historial local y la base de datos siempre coherentes.
- **Concurrencia optimista** con `layout_version`: una versión desfasada devuelve `409` y el editor ofrece recargar.
- **Identificadores UUID generados en el cliente**, de modo que deshacer un borrado recrea el elemento con su misma identidad.
- **Sin pérdida de stock**: los racks con contenido se marcan como eliminados (_soft delete_) y las ubicaciones ocupadas que quedan fuera de la rejilla se conservan ocultas; deshacer las recupera.
- **Unidades reales**: todas las medidas se expresan en metros.
- **Errores consistentes**: todas las respuestas usan `{ success, data }` o `{ success: false, code, message, details? }`, sin exponer _stack traces_.

## Estructura del proyecto

```text
ArcadiaDimension/
├── api/
│   └── index.ts               # Entrada serverless de Vercel (Fastify)
├── database/
│   ├── schema.sql             # Esquema completo para ejecutar en Neon
│   └── demo.sql               # Datos de demostración (opcional)
├── public/                    # Favicon y estáticos
├── scripts/
│   └── db-exec.ts             # Ejecuta ficheros SQL contra DATABASE_URL
├── server/
│   ├── app.ts                 # Construcción de la app, errores y rutas
│   ├── dev.ts                 # Servidor local de desarrollo
│   ├── config/                # Validación perezosa de variables de entorno
│   ├── db/                    # Cliente, esquema Drizzle, mappers y consultas
│   ├── lib/                   # Auth, errores, validación y utilidades HTTP
│   ├── modules/               # auth · warehouses · layout · locations
│   └── tests/                 # Tests de integración de la API
├── shared/                    # Esquemas Zod, tipos del dominio y DTOs
├── src/
│   ├── components/            # Sistema de diseño (ui/), marca y layout
│   ├── features/
│   │   ├── auth/              # Sesión, login, registro y guards
│   │   ├── warehouses/        # Dashboard, tarjetas y formularios
│   │   └── editor/
│   │       ├── canvas/        # Stage, capas, formas, Transformer y viewport
│   │       ├── panels/        # Paleta, propiedades, toolbar y cabecera
│   │       ├── locations/     # Diálogo de ubicaciones y contenido
│   │       ├── search/        # Buscador de artículos
│   │       ├── store/         # Store Zustand y comandos
│   │       ├── hooks/         # Autosave y atajos de teclado
│   │       └── lib/           # Geometría, historial, catálogo y ocupación
│   ├── hooks/ · lib/ · pages/
│   └── main.tsx
├── .env.example
├── vercel.json
└── package.json
```

## Modelo de datos

```mermaid
erDiagram
  users ||--o{ warehouses : "posee"
  warehouses ||--o{ warehouse_elements : "contiene"
  warehouse_elements ||--o{ rack_locations : "genera (racks)"
  rack_locations ||--o| location_contents : "almacena"

  users { uuid id PK
    varchar email UK
    varchar name
    text password_hash }
  warehouses { uuid id PK
    uuid owner_id FK
    varchar name
    double width
    double height
    int layout_version }
  warehouse_elements { uuid id PK
    uuid warehouse_id FK
    varchar type
    varchar name
    double x
    double y
    double width
    double height
    double rotation
    jsonb properties
    int sort_order
    timestamptz deleted_at }
  rack_locations { uuid id PK
    uuid element_id FK
    smallint row_number
    smallint column_number
    varchar code }
  location_contents { uuid id PK
    uuid location_id FK
    varchar article_code
    varchar description
    int quantity
    varchar lot }
```

- Todas las tablas tienen `created_at` y `updated_at`, este último mantenido por un _trigger_.
- Claves foráneas con `ON DELETE CASCADE`, restricciones `CHECK` (dimensiones positivas, tipos válidos, cantidades > 0) y unicidad (email sin distinguir mayúsculas, posición de ubicación y un contenido por ubicación).
- Índices para listados por propietario y un índice **trigram** (`pg_trgm`) para la búsqueda de artículos.

## API REST

Todas las rutas, salvo `health` y `auth`, requieren sesión.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Estado del servicio |
| `POST` | `/api/auth/register` | Registro e inicio de sesión |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/logout` | Cierre de sesión |
| `GET` | `/api/auth/me` | Usuario actual (`null` si no hay sesión) |
| `GET` | `/api/warehouses` | Almacenes con métricas y miniatura |
| `POST` | `/api/warehouses` | Crear almacén |
| `GET` · `PATCH` · `DELETE` | `/api/warehouses/:id` | Consultar, editar o eliminar |
| `GET` | `/api/warehouses/:id/layout` | Plano completo |
| `PUT` | `/api/warehouses/:id/layout` | Guardar plano (`baseVersion` + elementos) |
| `GET` | `/api/warehouses/:id/occupancy` | Ocupación por rack y por columna |
| `GET` | `/api/warehouses/:id/search?q=` | Buscar artículos, lotes o ubicaciones |
| `GET` | `/api/racks/:id/locations` | Ubicaciones de un rack con su contenido |
| `PUT` · `DELETE` | `/api/locations/:id/content` | Asignar o vaciar el contenido de una ubicación |

```jsonc
// Éxito
{ "success": true, "data": { /* ... */ } }

// Error
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "El ancho: mínimo 5 m",
  "details": [{ "path": "width", "message": "El ancho: mínimo 5 m" }]
}
```

## Puesta en marcha

### Requisitos

- Node.js **22.x** y npm
- Una base de datos PostgreSQL: [Neon](https://neon.tech) (recomendado) o PostgreSQL local

### Instalación

```bash
git clone https://github.com/JoseAQuinto/ArcadiaDimension.git
cd ArcadiaDimension
npm install
cp .env.example .env
```

### Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL. En Neon, usa la conexión **pooled** (host con `-pooler`) con `sslmode=require`. |
| `JWT_SECRET` | Sí | Secreto para firmar la sesión, de al menos 32 caracteres. |
| `API_PORT` | No | Puerto del API en local (por defecto `3001`). |
| `LOG_LEVEL` | No | Nivel de log de Fastify (por defecto `info`). |

Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Configurar Neon

1. Crea un proyecto en [Neon](https://console.neon.tech) (PostgreSQL 15 o superior).
2. En **Connect**, copia la cadena de conexión **pooled** y pégala en `DATABASE_URL`.
3. Abre el **SQL Editor** de Neon y ejecuta el contenido de [`database/schema.sql`](database/schema.sql). Es idempotente y se puede ejecutar varias veces.
4. (Opcional) Ejecuta [`database/demo.sql`](database/demo.sql) para cargar los datos de demostración.

También puedes aplicar ambos ficheros desde tu equipo con la `DATABASE_URL` configurada:

```bash
npm run db:schema
npm run db:demo
```

### Cuenta demo

Tras ejecutar `demo.sql`:

- **Email:** `demo@arcadiadimension.app`
- **Contraseña:** `demo1234`

Incluye el _Almacén Demo Valencia_ (8 racks con distintos niveles de ocupación, zonas, muelles, puertas y columnas) y la _Nave Sagunto_. Prueba a buscar `ART-00125`.

### Desarrollo local

```bash
npm run dev
```

Arranca el API en `http://localhost:3001` y Vite en `http://localhost:5173`, con proxy de `/api`.

¿Sin Neon? Levanta PostgreSQL con Docker y apunta `DATABASE_URL` a él:

```bash
docker run --name arcadia-pg -e POSTGRES_USER=arcadia -e POSTGRES_PASSWORD=arcadia -e POSTGRES_DB=arcadia -p 5432:5432 -d postgres:17-alpine
```

```text
DATABASE_URL=postgresql://arcadia:arcadia@localhost:5432/arcadia
```

### Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | API + frontend en modo desarrollo |
| `npm run build` | Typecheck de todos los proyectos y build de producción |
| `npm run preview` | Sirve el build del frontend |
| `npm run typecheck` | TypeScript (app, servidor y configuración) |
| `npm run lint` | ESLint |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:integration` | Tests de integración de la API contra `DATABASE_URL` |
| `npm run format` | Prettier |
| `npm run db:schema` / `npm run db:demo` | Ejecutan `schema.sql` / `demo.sql` |

## Calidad y tests

- **Unitarios**: snap y geometría (rotación alrededor del centro, _bounding boxes_, zoom), historial de deshacer/rehacer, store del editor, generación de códigos de ubicación, factoría de elementos, cálculo de ocupación, validaciones Zod y el _diff_ de guardado del plano.
- **Integración**: flujo completo de la API contra PostgreSQL real con `app.inject` (autenticación, aislamiento entre usuarios, validaciones, conflicto de versiones, ubicaciones, contenido, ocupación, búsqueda y conservación del stock al reducir, renombrar o eliminar y restaurar un rack). Crea usuarios temporales `@integration.test` y los elimina al terminar.

```bash
npm run typecheck && npm run lint && npm test
npm run test:integration   # requiere DATABASE_URL
```

## Build

```bash
npm run build
```

Genera `dist/` con _code splitting_: el editor y Konva se cargan solo al abrir un almacén.

## Despliegue en Vercel

El repositorio ya incluye la configuración necesaria (`vercel.json`): framework Vite, salida `dist/`, función `api/index.ts` y reescrituras para el API y la SPA.

1. En Vercel, **Add New → Project** e importa el repositorio de GitHub. No hace falta cambiar los ajustes de build.
2. En **Settings → Environment Variables**, añade `DATABASE_URL` (conexión _pooled_ de Neon) y `JWT_SECRET`. Si usas la integración de Neon del marketplace de Vercel, `DATABASE_URL` se crea automáticamente.
3. Ejecuta `database/schema.sql` (y opcionalmente `database/demo.sql`) en el SQL Editor de Neon.
4. Pulsa **Deploy** y comprueba `https://<tu-dominio>/api/health`.

> La cookie de sesión se marca como `Secure` en producción. Frontend y API comparten dominio, así que no hace falta configurar CORS.

## Limitaciones actuales

- Selección de un único elemento; no hay selección múltiple, alineación ni agrupación.
- Una ubicación contiene un único artículo y no existe un maestro de artículos ni un histórico de movimientos.
- Los conflictos entre sesiones se detectan y se resuelven recargando; no hay edición colaborativa en tiempo real.
- Los racks eliminados que tenían stock se conservan en la base de datos, sin tarea de purga.
- La autenticación no incluye limitación de intentos, recuperación de contraseña ni verificación de email.
- La experiencia está optimizada para escritorio; la interacción táctil es básica.
- La interfaz solo está en español.

## Roadmap

- [ ] Colaboración en tiempo real mediante **WebSockets**
- [ ] **Heatmaps** de actividad y rotación de artículos
- [ ] **Rutas internas** y cálculo de recorridos de picking
- [ ] **Histórico** de cambios del plano y **movimientos** de stock
- [ ] **Múltiples plantas** por almacén
- [ ] **Exportar plano** a PNG, PDF o SVG
- [ ] **Digital twin en tiempo real** conectado a sensores o a un WMS
- [ ] **Métricas** y paneles de rendimiento del almacén
- [ ] **Permisos**, roles y organizaciones
- [ ] Selección múltiple, alineación y plantillas de layout
- [ ] Vista **3D** opcional

---

<div align="center">
Desarrollado por <a href="https://github.com/JoseAQuinto">José Ángel Quinto</a> como proyecto de portfolio.
</div>
