const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const openapiSpec = require('../docs/openapi.json');
const collectionPath = path.join(__dirname, '../docs/postman/postman_collection.json');

describe('Postman collection generation', () => {
  beforeAll(() => {
    execSync('node docs/postman/generate-postman.js', { cwd: path.join(__dirname, '..') });
  });

  test('produces valid JSON matching the Postman Collection v2.1 shape', () => {
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    expect(collection.info.schema).toBe('https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
    expect(Array.isArray(collection.item)).toBe(true);
  });

  test('covers every operation defined in openapi.json — no silent drift', () => {
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    const totalOperations = Object.values(openapiSpec.paths).reduce(
      (sum, methods) => sum + Object.keys(methods).length,
      0
    );
    const totalRequests = collection.item.reduce((sum, folder) => sum + folder.item.length, 0);
    expect(totalRequests).toBe(totalOperations);
  });

  test('device-authenticated endpoints get device headers, not a bearer token', () => {
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    const attendanceFolder = collection.item.find((f) => f.name === 'Attendance');
    const markRequest = attendanceFolder.item.find((r) => r.name === 'POST /attendance/mark');

    const headerKeys = markRequest.request.header.map((h) => h.key);
    expect(headerKeys).toContain('x-device-code');
    expect(headerKeys).toContain('x-device-api-key');
    expect(headerKeys).not.toContain('Authorization');
  });

  test('the generated request body for user creation matches the STUDENT discriminated-union shape', () => {
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    const usersFolder = collection.item.find((f) => f.name === 'Users');
    const createRequest = usersFolder.item.find((r) => r.name === 'POST /users');
    const body = JSON.parse(createRequest.request.body.raw);

    expect(body.role).toBe('STUDENT');
    expect(body.profile).toEqual(
      expect.objectContaining({ rollNumber: expect.any(String), courseId: expect.any(Number) })
    );
  });
});
