import { describe, it, expect, beforeEach } from 'vitest';
import { idbGet, idbSet, idbDelete, idbClear } from '../storage/indexedDb';

describe('IndexedDB Storage Helper Unit Tests', () => {
  beforeEach(async () => {
    await idbClear();
  });

  it('returns null for non-existent key', async () => {
    const result = await idbGet('non_existent_key');
    expect(result).toBeNull();
  });

  it('stores and retrieves complex objects correctly', async () => {
    const payload = {
      id: 'whiteboard-123',
      shapes: [{ id: 'shape-1', type: 'draw', x: 10, y: 20 }],
      lastModified: 1723630000,
    };

    await idbSet('test_wb', payload);
    const retrieved = await idbGet<typeof payload>('test_wb');
    expect(retrieved).toEqual(payload);
  });

  it('deletes an existing key', async () => {
    await idbSet('to_delete', { hello: 'world' });
    expect(await idbGet('to_delete')).not.toBeNull();

    await idbDelete('to_delete');
    expect(await idbGet('to_delete')).toBeNull();
  });

  it('clears all entries', async () => {
    await idbSet('key1', 'val1');
    await idbSet('key2', 'val2');

    await idbClear();
    expect(await idbGet('key1')).toBeNull();
    expect(await idbGet('key2')).toBeNull();
  });
});
