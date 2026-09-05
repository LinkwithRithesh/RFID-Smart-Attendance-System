jest.mock('../src/repositories/device.repository', () => ({
  findByCode: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const bcrypt = require('bcrypt');

const deviceRepository = require('../src/repositories/device.repository');
const authenticateDevice = require('../src/middleware/authenticateDevice');
const { errorHandler } = require('../src/middleware/errorHandler');

function buildApp() {
  const app = express();
  app.get('/device-only', authenticateDevice, (req, res) => res.json({ deviceId: req.device.id }));
  app.use(errorHandler);
  return app;
}

describe('authenticateDevice middleware', () => {
  const app = buildApp();

  beforeEach(() => jest.clearAllMocks());

  test('rejects requests with no device headers', async () => {
    const res = await request(app).get('/device-only');
    expect(res.status).toBe(401);
    expect(deviceRepository.findByCode).not.toHaveBeenCalled();
  });

  test('rejects an unknown device code', async () => {
    deviceRepository.findByCode.mockResolvedValue(null);
    const res = await request(app)
      .get('/device-only')
      .set('x-device-code', 'UNKNOWN')
      .set('x-device-api-key', 'whatever');
    expect(res.status).toBe(401);
  });

  test('rejects a wrong API key for a real device', async () => {
    const correctHash = await bcrypt.hash('correct-key', 10);
    deviceRepository.findByCode.mockResolvedValue({ id: 1, deviceCode: 'ESP32-01', apiKeyHash: correctHash, status: 'ONLINE' });

    const res = await request(app)
      .get('/device-only')
      .set('x-device-code', 'ESP32-01')
      .set('x-device-api-key', 'wrong-key');
    expect(res.status).toBe(401);
  });

  test('rejects a decommissioned device even with the correct key', async () => {
    const correctHash = await bcrypt.hash('correct-key', 10);
    deviceRepository.findByCode.mockResolvedValue({
      id: 1, deviceCode: 'ESP32-01', apiKeyHash: correctHash, status: 'DECOMMISSIONED',
    });

    const res = await request(app)
      .get('/device-only')
      .set('x-device-code', 'ESP32-01')
      .set('x-device-api-key', 'correct-key');
    expect(res.status).toBe(403);
  });

  test('accepts a valid device code + API key and attaches req.device', async () => {
    const correctHash = await bcrypt.hash('correct-key', 10);
    deviceRepository.findByCode.mockResolvedValue({ id: 1, deviceCode: 'ESP32-01', apiKeyHash: correctHash, status: 'ONLINE' });

    const res = await request(app)
      .get('/device-only')
      .set('x-device-code', 'ESP32-01')
      .set('x-device-api-key', 'correct-key');
    expect(res.status).toBe(200);
    expect(res.body.deviceId).toBe(1);
  });
});
