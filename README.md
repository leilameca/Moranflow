# Moran Studio Manager

Moran Studio Manager es un sistema web fullstack tipo CRM para gestionar clientes, servicios, proyectos, pagos y facturas premium de Moran Studio.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Base de datos: SQLite
- PDF: PDFKit
- Autenticacion: JWT

## Estructura final

```text
Moran studio Manager/
  backend/
    data/
      .gitkeep
    src/
      config/
      controllers/
      database/
      middleware/
      routes/
      services/
      utils/
    .env.example
    package.json
    server.js
  frontend/
    public/
    src/
      assets/
      components/
      context/
      hooks/
      i18n/
      pages/
      services/
      styles/
      utils/
    .env.example
    package.json
    vite.config.js
  render.yaml
  package.json
  .gitignore
  README.md
```

## Caracteristicas principales

- Login seguro con JWT
- Dashboard con metricas clave
- CRUD de clientes
- CRUD de servicios dinamicos
- CRUD de proyectos
- Registro de pagos parciales o completos
- Generacion de facturas PDF
- Interfaz responsive para escritorio y movil
- Soporte bilingue ES/EN en la UI

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalacion local

1. Instala dependencias:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. Crea archivos de entorno a partir de los ejemplos:

```bash
copy backend\\.env.example backend\\.env
copy frontend\\.env.example frontend\\.env
```

3. Configura valores locales.

Backend sugerido:

```env
PORT=4000
DATABASE_PATH=./data/moran-studio.db
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=tu-secreto-local-seguro
```

Frontend sugerido:

```env
VITE_API_URL=http://localhost:4000/api
```

Si dejas `VITE_API_URL` vacio, Vite usara un proxy local hacia `http://localhost:4000`.

4. Ejecuta el proyecto:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

Health check: `http://localhost:4000/api/health`

## Credenciales iniciales

- Email: `admin@moranstudio.local`
- Password: `MoranAdmin123!`

En produccion puedes sobreescribirlas con variables de entorno del backend:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_ROLE`
- `ADMIN_SYNC_ON_BOOT`

## Variables de entorno

### Backend

- `PORT`
- `DATABASE_PATH`
- `CORS_ORIGINS`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `BODY_LIMIT`
- `API_RATE_LIMIT_WINDOW_MS`
- `API_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX`
- `TRUST_PROXY`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_ROLE`
- `ADMIN_SYNC_ON_BOOT`

### Frontend

- `VITE_API_URL`

## SQLite con persistencia en produccion

El backend ya usa una ruta configurable con `DATABASE_PATH`.

Para Render debes montar un disco persistente y apuntar la base de datos a una ruta del disco, por ejemplo:

```env
DATABASE_PATH=/var/data/moran-studio.db
```

El archivo `render.yaml` ya deja esa configuracion preparada.

## CORS

El backend acepta origenes definidos en `CORS_ORIGINS`.

Puedes pasar varios dominios separados por comas:

```env
CORS_ORIGINS=http://localhost:5173,https://moranflow.vercel.app,https://*.vercel.app
```

Tambien soporta comodines como `https://*.vercel.app` para previews de Vercel.

## Scripts

### Raiz

- `npm run dev`
- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run build`
- `npm start`

### Backend

- `npm run dev`
- `npm start`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Despliegue en Render

### Opcion recomendada: Blueprint

1. Sube el proyecto a GitHub.
2. En Render elige `New +` -> `Blueprint`.
3. Conecta el repositorio.
4. Render detectara `render.yaml`.
5. Configura manualmente `CORS_ORIGINS` con tu dominio real de Vercel.
6. Despliega.

### Opcion manual

1. Crea un nuevo `Web Service`.
2. Conecta el repositorio.
3. Define:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Agrega variables:
   - `NODE_ENV=production`
   - `DATABASE_PATH=/var/data/moran-studio.db`
   - `JWT_SECRET=tu-secreto-seguro`
   - `CORS_ORIGINS=https://tu-frontend.vercel.app,https://*.vercel.app`
   - `ADMIN_EMAIL=admin@moranstudio.local`
   - `ADMIN_PASSWORD=MoranAdmin123!`
   - `ADMIN_SYNC_ON_BOOT=true`
5. Agrega un `Persistent Disk` montado en `/var/data`.
6. Despliega.

Si el login dice `Credenciales invalidas` en Vercel/Render, casi siempre significa que la SQLite de Render ya existe y el admin guardado ahi no coincide con lo que estas intentando usar. La forma mas rapida de corregirlo es:

1. En Render define `ADMIN_EMAIL` y `ADMIN_PASSWORD` con las credenciales que quieras usar.
2. Pon `ADMIN_SYNC_ON_BOOT=true`.
3. Redeploy del backend.
4. Inicia sesion con esas credenciales.
5. Si quieres, luego cambia `ADMIN_SYNC_ON_BOOT=false` para que no reescriba el admin en cada arranque.

## Despliegue en Vercel

1. Crea un nuevo proyecto en Vercel.
2. Conecta el mismo repositorio.
3. Define:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Configura la variable:

```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

5. Despliega.

## Pasos exactos para subir a GitHub

Si el repositorio remoto esta vacio:

```bash
git init
git branch -M main
git remote add origin https://github.com/leilameca/Moranflow.git
git add .
git commit -m "Prepare Moran Studio Manager for production deployment"
git push -u origin main
```

Si el remoto ya esta conectado:

```bash
git add .
git commit -m "Prepare Moran Studio Manager for production deployment"
git push
```

## Verificacion recomendada antes de desplegar

```bash
npm run lint --prefix frontend
npm run build --prefix frontend
npm start --prefix backend
```

## API principal

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/clients`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/services`
- `POST /api/services`
- `PUT /api/services/:id`
- `DELETE /api/services/:id`
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/payments/project/:projectId`
- `DELETE /api/payments/:id`
- `GET /api/invoices`
- `POST /api/invoices/project/:projectId`
- `GET /api/invoices/:id/pdf`
