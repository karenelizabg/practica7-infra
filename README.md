# Práctica 7 — Pipeline con UAT

Worker de Cloudflare (TypeScript + D1) con unit tests, coverage y un pipeline de GitHub Actions que construye, prueba, publica el artefacto, despliega a un proyecto **nuevo** de Cloudflare (Prod) y ejecuta pruebas **UAT** contra producción.

## Estructura

```
src/index.ts              Worker (GET /, GET /health, POST /user)
src/validators.ts         Validación del formulario
test/*.spec.ts            Unit tests (Vitest, D1 mockeada)
vitest.config.ts          Coverage v8 (text, html, lcov, json-summary) + umbral 80%
scripts/uat.mjs           Pruebas UAT → genera uat-report.md
schema.sql                Tabla users (idempotente)
wrangler.jsonc            Dev: practica7 · Prod: practica7-prod
.github/workflows/pipeline.yml
```

## Pipeline

| Job | Qué hace |
|---|---|
| `build-test` | `npm ci` → typecheck → build (`wrangler deploy --dry-run --outdir dist`) → unit tests con coverage → publica artefactos `practica7-build` y `practica7-coverage` |
| `deploy-prod` | Descarga el artefacto, aplica `schema.sql` a D1 prod y despliega `wrangler deploy --env production` (Worker **practica7-prod**) |
| `uat` | Corre `scripts/uat.mjs` contra la URL de prod y publica `uat-report.md` (también en el Summary del run) |

## Pasos (una sola vez)

```bash
npm install                                   # genera package-lock.json (npm ci lo necesita)
npm test                                      # unit tests
npm run test:coverage                         # coverage → abre coverage/index.html
npx wrangler login
npx wrangler d1 create practica07-prod        # copia el database_id a wrangler.jsonc (env.production)
```

En GitHub → **Settings → Secrets and variables → Actions** crea:

- `CLOUDFLARE_API_TOKEN` (plantilla "Edit Cloudflare Workers" + permiso D1 Edit)
- `CLOUDFLARE_ACCOUNT_ID`

Luego `git push` a `main` y revisa la pestaña **Actions**.

## UAT local

```bash
npm run uat -- https://practica7-prod.<tu-subdominio>.workers.dev
```
