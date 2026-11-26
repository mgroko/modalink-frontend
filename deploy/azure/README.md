# Frontend — despliegue en Azure

La guía completa (VM, DuckDNS, PostgreSQL, Caddy, variables y operación) está en
el repo del backend:

```text
backend/deploy/azure/README.md
```

## Qué aporta este repo

- `src/services/http.js` usa `VITE_API_BASE_URL` (por defecto
  `http://localhost:8080` para desarrollo).
- `deploy/azure/Dockerfile` compila el SPA con Node 22 y lo sirve desde Caddy.
- `deploy/azure/Caddyfile` sirve la SPA y hace de reverse proxy:
  - `/api/*` → backend (quitando `/api`)
  - `/oauth2/*`, `/login/oauth2/*`, `/uploads/*` → backend
  - resto → `index.html`
- `.github/workflows/publish-image.yml` publica
  `ghcr.io/<owner>/modalink-frontend:latest` al pushear `deploy/azure`.

## Build local

```powershell
docker build -f deploy/azure/Dockerfile `
  --build-arg VITE_API_BASE_URL=/api `
  -t ghcr.io/mgroko/modalink-frontend:latest .
```

## Desarrollo local

Sin `VITE_API_BASE_URL`, el frontend sigue apuntando a
`http://localhost:8080`, así que `npm run dev` funciona igual que antes.
