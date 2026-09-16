# ProfitZone – Backend

API del proyecto ProfitZone (Seminario UADE), hecha con Node.js + Express 5 (ESM).

## Requisitos

- Node.js 20+

## Puesta en marcha

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm run dev            # http://localhost:8080/api
```

## Scripts

| Script          | Descripción                          |
| --------------- | ------------------------------------ |
| `npm start`     | Levanta la API                       |
| `npm run dev`   | Levanta la API con recarga (nodemon) |

## Variables de entorno

Se validan al arrancar en `src/config/env.js`: si falta una obligatoria o tiene
un formato inválido, el proceso falla con un mensaje explicando qué corregir.

| Variable       | Obligatoria | Default       | Descripción                                            |
| -------------- | ----------- | ------------- | ------------------------------------------------------ |
| `NODE_ENV`     | No          | `development` | `development` \| `test` \| `production`                |
| `PORT`         | No          | `8080`        | Puerto de escucha (1-65535)                            |
| `CORS_ORIGINS` | Sí          | —             | URLs permitidas, separadas por coma (`http://...`)     |

## CORS

Configurado en `src/config/cors.js`: solo se aceptan los orígenes de
`CORS_ORIGINS`. Un origen no listado recibe **403**. Las peticiones sin header
`Origin` (curl, Postman, healthchecks) se permiten. Habilita `credentials`, los
headers `Content-Type` y `Authorization`, y cachea el preflight 24 h.

## Endpoints

| Método | Ruta          | Descripción                  |
| ------ | ------------- | ---------------------------- |
| `GET`  | `/api/health` | Estado del servicio          |

## Estructura

```
src/
  config/       env.js (validación), cors.js
  controllers/  lógica de cada endpoint
  middlewares/  notFound, errorHandler
  routes/       index.js + routers por recurso
  services/     acceso a datos / lógica de negocio
  utils/        helpers
  app.js        configuración de Express
  server.js     punto de entrada
```
