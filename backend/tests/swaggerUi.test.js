const express = require('express');
const helmet = require('helmet');
const request = require('supertest');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('../docs/openapi.json');

function buildApp() {
  const app = express();

  app.use((req, res, next) => {
    if (req.path.startsWith('/api-docs')) {
      return helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
          },
        },
      })(req, res, next);
    }
    return helmet()(req, res, next);
  });

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  return app;
}

describe('Swagger UI mounting', () => {
  const app = buildApp();

  test('serves the Swagger UI HTML page at /api-docs', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('swagger-ui');
  });

  test('/api-docs gets a relaxed CSP that permits inline scripts/styles', async () => {
    const res = await request(app).get('/api-docs/');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  test("every other route keeps the strict default CSP (script-src has no unsafe-inline)", async () => {
    const res = await request(app).get('/health');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  test('the served spec is the real, valid OpenAPI document', async () => {
    const res = await request(app).get('/api-docs/swagger-ui-init.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Smart Campus Attendance Management System API');
  });
});
