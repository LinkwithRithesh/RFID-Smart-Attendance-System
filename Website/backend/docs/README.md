# API Documentation

## Swagger UI
With the server running, open `http://localhost:5000/api-docs`. The spec itself lives at
`docs/openapi.json` — it's the single source of truth for both Swagger and Postman.

## Postman
Import `docs/postman/postman_collection.json` into Postman. Set these collection variables
before running requests:

| Variable | Where to get it |
|---|---|
| `baseUrl` | Defaults to `http://localhost:5000/api/v1` |
| `accessToken` | Response of `POST /auth/login` |
| `refreshToken` | Response of `POST /auth/login` |
| `deviceCode` / `deviceApiKey` | Response of `POST /devices` (admin-registered device) |

If you add or change an endpoint, update `docs/openapi.json` first, then regenerate the
Postman collection so the two never drift apart:

```
node docs/postman/generate-postman.js
```
