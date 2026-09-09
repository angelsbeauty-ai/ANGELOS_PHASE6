import { PublishingAdapterRegistry } from '../apps/api/src/content/publishing-adapter.registry';
import { ManualDemoPublishingAdapter } from '../apps/api/src/content/publishing-adapter';
import { describe, it, expect, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('PublishingAdapterRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new PublishingAdapterRegistry();
    // Manually trigger onModuleInit since we're not in NestJS context
    registry.onModuleInit();
  });

  it('registers manual demo adapter by default', () => {
    assert.ok(registry.has('manual'), 'manual adapter should be registered');
    const adapter = registry.resolve('manual');
    assert.ok(adapter instanceof ManualDemoPublishingAdapter);
  });

  it('resolves manual adapter', () => {
    const adapter = registry.resolve('manual');
    assert.ok(adapter, 'manual adapter should resolve');
    assert.equal(typeof adapter.publish, 'function');
  });

  it('returns null for unregistered platform', () => {
    assert.equal(registry.resolve('instagram'), null);
    assert.equal(registry.resolve('facebook'), null);
  });

  it('can register a new adapter', () => {
    const mockAdapter = {
      publish: async () => ({ status: 'published', providerPostId: 'test123' })
    };
    registry.register('instagram', mockAdapter);
    assert.ok(registry.has('instagram'));
    assert.equal(registry.resolve('instagram'), mockAdapter);
  });

  it('livePlatforms excludes manual', () => {
    assert.deepEqual(registry.livePlatforms, []);
  });

  it('livePlatforms includes registered non-manual adapters', () => {
    registry.register('instagram', { publish: async () => ({ status: 'published' }) });
    assert.ok(registry.livePlatforms.includes('instagram'));
    assert.equal(registry.livePlatforms.length, 1);
  });
});
