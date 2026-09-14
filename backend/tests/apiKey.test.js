const { generateApiKey, hashApiKey, compareApiKey } = require('../src/utils/apiKey');

describe('apiKey utils', () => {
  test('generates a sufficiently long random hex key that differs each call', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).toMatch(/^[0-9a-f]{64}$/);
    expect(key1).not.toBe(key2);
  });

  test('hashes the key and verifies it correctly, rejecting wrong keys', async () => {
    const key = generateApiKey();
    const hash = await hashApiKey(key);

    expect(hash).not.toBe(key);
    await expect(compareApiKey(key, hash)).resolves.toBe(true);
    await expect(compareApiKey(generateApiKey(), hash)).resolves.toBe(false);
  });
});
