# Reglas de reescritura de Amplify Hosting (app `dyrr9jh4hr3xk`)

Amplify no lee estas reglas del repo: se aplican a la app con la CLI (cambio
inmediato, sin desplegar) y conviven con `customHttp.yml` (cabeceras).

```bash
aws amplify update-app --app-id dyrr9jh4hr3xk --region sa-east-1 --profile usfq \
  --custom-rules file://infra/amplify/custom-rules.json
```

Qué hacen (probadas en una app temporal de Amplify antes de aplicarlas):

| Ruta | Antes | Con estas reglas |
|---|---|---|
| `/landing/<id>` (así se comparten) | 301 → `/landing/<id>/` | **200** directo al HTML estático |
| `/landing/<id>/`, `/landing/<id>/en(/)` | HTML estático | igual (200) |
| landing sin HTML estático (nueva) | 404 + app SPA | igual |
| `/landing/<id>/registro`, `/encuesta`, `/admin/*` | 301 + 404 + app SPA | igual |
| `eventflow.ec/*` | 302 → `www` | **301** (permanente) |

Las landings estáticas las genera `scripts/landing/prerender.mjs` en cada build.
El orden importa: las dos reglas de landing van antes de la regla SPA general.
Rollback: volver a la regla anterior con el mismo comando
(`[{"source":"https://eventflow.ec","target":"https://www.eventflow.ec","status":"302"},{"source":"/<*>","target":"/index.html","status":"404-200"}]`).
