jest.mock('../src/repositories/device.repository', () => ({
  findByCode: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
  updateApiKeyHash: jest.fn(),
  decommission: jest.fn(),
  recordHeartbeat: jest.fn(),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));

const deviceRepository = require('../src/repositories/device.repository');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const deviceService = require('../src/services/device.service');

function makeDevice(overrides = {}) {
  return {
    id: 1,
    deviceCode: 'ESP32-CSE-01',
    location: 'CSE Block Entrance',
    departmentId: 1,
    status: 'OFFLINE',
    firmwareVersion: '1.0.0',
    lastHeartbeatAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
});

describe('registerDevice', () => {
  test('rejects a duplicate device code', async () => {
    deviceRepository.findByCode.mockResolvedValue(makeDevice());
    await expect(
      deviceService.registerDevice({ deviceCode: 'ESP32-CSE-01', departmentId: 1 }, 99)
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(deviceRepository.create).not.toHaveBeenCalled();
  });

  test('creates the device and returns the plaintext API key exactly once', async () => {
    deviceRepository.findByCode.mockResolvedValue(null);
    deviceRepository.create.mockResolvedValue(makeDevice());

    const result = await deviceService.registerDevice(
      { deviceCode: 'ESP32-CSE-01', departmentId: 1 },
      99
    );

    expect(result.apiKey).toMatch(/^[0-9a-f]{64}$/);
    expect(deviceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ deviceCode: 'ESP32-CSE-01', apiKeyHash: expect.any(String) })
    );
    // the stored hash must never equal the plaintext key returned to the caller
    expect(deviceRepository.create.mock.calls[0][0].apiKeyHash).not.toBe(result.apiKey);
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DEVICE_REGISTERED', actorId: 99 })
    );
  });
});

describe('decommissionDevice', () => {
  test('throws 404 for an unknown device', async () => {
    deviceRepository.findById.mockResolvedValue(null);
    await expect(deviceService.decommissionDevice(999, 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 409 if already decommissioned', async () => {
    deviceRepository.findById.mockResolvedValue(makeDevice({ status: 'DECOMMISSIONED' }));
    await expect(deviceService.decommissionDevice(1, 1)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('decommissions an active device', async () => {
    deviceRepository.findById.mockResolvedValue(makeDevice({ status: 'ONLINE' }));
    deviceRepository.decommission.mockResolvedValue({});
    await deviceService.decommissionDevice(1, 1);
    expect(deviceRepository.decommission).toHaveBeenCalledWith(1);
  });
});

describe('rotateApiKey', () => {
  test('refuses to rotate the key of a decommissioned device', async () => {
    deviceRepository.findById.mockResolvedValue(makeDevice({ status: 'DECOMMISSIONED' }));
    await expect(deviceService.rotateApiKey(1, 1)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('rotates the key and returns the new plaintext value', async () => {
    deviceRepository.findById.mockResolvedValue(makeDevice({ status: 'ONLINE' }));
    deviceRepository.updateApiKeyHash.mockResolvedValue({});

    const result = await deviceService.rotateApiKey(1, 1);
    expect(result.apiKey).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('recordHeartbeat', () => {
  test('promotes OFFLINE to ONLINE on heartbeat', async () => {
    const device = makeDevice({ status: 'OFFLINE' });
    deviceRepository.recordHeartbeat.mockResolvedValue(makeDevice({ status: 'ONLINE', lastHeartbeatAt: new Date() }));

    await deviceService.recordHeartbeat(device, '1.2.0');

    expect(deviceRepository.recordHeartbeat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'ONLINE', firmwareVersion: '1.2.0' })
    );
  });

  test('does NOT override an admin-set MAINTENANCE hold on heartbeat', async () => {
    const device = makeDevice({ status: 'MAINTENANCE' });
    deviceRepository.recordHeartbeat.mockResolvedValue(makeDevice({ status: 'MAINTENANCE' }));

    await deviceService.recordHeartbeat(device);

    expect(deviceRepository.recordHeartbeat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'MAINTENANCE' })
    );
  });

  test('leaves an already-ONLINE device as ONLINE', async () => {
    const device = makeDevice({ status: 'ONLINE' });
    deviceRepository.recordHeartbeat.mockResolvedValue(makeDevice({ status: 'ONLINE' }));

    await deviceService.recordHeartbeat(device);

    expect(deviceRepository.recordHeartbeat).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'ONLINE' }));
  });
});
