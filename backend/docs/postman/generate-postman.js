/**
 * One-off generator: reads docs/openapi.json (the single source of truth for
 * endpoints) and produces a Postman Collection v2.1 file. Re-run this
 * whenever openapi.json changes, rather than hand-maintaining two documents
 * that can drift apart.
 *
 * Usage: node docs/postman/generate-postman.js
 */
const fs = require('fs');
const path = require('path');

const spec = require('../openapi.json');

function exampleForSchema(schema) {
  if (!schema) return {};
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop();
    return exampleForSchema(spec.components.schemas[name]);
  }
  if (schema.oneOf) return exampleForSchema(schema.oneOf[0]);
  if (schema.allOf) return schema.allOf.reduce((acc, s) => ({ ...acc, ...exampleForSchema(s) }), {});
  if (schema.type === 'object') {
    const result = {};
    for (const [key, propSchema] of Object.entries(schema.properties || {})) {
      result[key] = exampleValue(propSchema, key);
    }
    return result;
  }
  return {};
}

function exampleValue(schema, key) {
  if (schema.$ref || schema.oneOf || schema.allOf || schema.type === 'object') return exampleForSchema(schema);
  if (schema.example !== undefined) return schema.example;
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'integer' || schema.type === 'number') return 1;
  if (schema.type === 'boolean') return true;
  if (schema.type === 'array') return [exampleValue(schema.items, key)];
  if (schema.format === 'email') return 'user@campus.edu';
  if (schema.format === 'date-time') return '2026-07-01T00:00:00.000Z';
  return `sample_${key}`;
}

function authHeaderFor(security) {
  if (!security) return [];
  const scheme = security[0];
  if (scheme.bearerAuth) {
    return [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }];
  }
  if (scheme.deviceCode) {
    return [
      { key: 'x-device-code', value: '{{deviceCode}}' },
      { key: 'x-device-api-key', value: '{{deviceApiKey}}' },
    ];
  }
  return [];
}

function buildRequestItem(urlPath, method, operation) {
  const headers = [{ key: 'Content-Type', value: 'application/json' }, ...authHeaderFor(operation.security)];

  const bodySchema = operation.requestBody?.content?.['application/json']?.schema;
  const body = bodySchema
    ? { mode: 'raw', raw: JSON.stringify(exampleForSchema(bodySchema), null, 2), options: { raw: { language: 'json' } } }
    : undefined;

  const queryParams = (operation.parameters || []).filter((p) => p.in === 'query');
  const rawUrl =
    '{{baseUrl}}' +
    urlPath +
    (queryParams.length ? '?' + queryParams.map((p) => `${p.name}=`).join('&') : '');

  return {
    name: `${method.toUpperCase()} ${urlPath}`,
    request: {
      method: method.toUpperCase(),
      header: headers,
      ...(body && { body }),
      url: {
        raw: rawUrl,
        host: ['{{baseUrl}}'],
        path: urlPath.split('/').filter(Boolean),
        query: queryParams.map((p) => ({ key: p.name, value: '', disabled: !p.required })),
      },
      description: operation.summary,
    },
  };
}

function buildCollection() {
  const folders = {};

  for (const [urlPath, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const tag = operation.tags?.[0] || 'Misc';
      if (!folders[tag]) folders[tag] = { name: tag, item: [] };
      folders[tag].item.push(buildRequestItem(urlPath, method, operation));
    }
  }

  return {
    info: {
      name: spec.info.title,
      description: spec.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:5000/api/v1' },
      { key: 'accessToken', value: '' },
      { key: 'refreshToken', value: '' },
      { key: 'deviceCode', value: '' },
      { key: 'deviceApiKey', value: '' },
    ],
    item: Object.values(folders),
  };
}

const collection = buildCollection();
const outPath = path.join(__dirname, 'postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));
console.log(`Wrote ${outPath} — ${collection.item.reduce((n, f) => n + f.item.length, 0)} requests across ${collection.item.length} folders.`);
