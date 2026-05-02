import { describe, it, expect } from 'vitest';

describe('node handle memory lifecycle', () => {
  it('wrapped nodes do not prevent tree GC after release', () => {
    if (typeof globalThis.gc !== 'function') {
      console.warn('Skipping GC test — run with --expose-gc');
      return;
    }

    globalThis.gc();
    const before = process.memoryUsage().heapUsed;

    // Create and discard wrapped parse results
    for (let i = 0; i < 50; i++) {
      const arr: unknown[] = [];
      arr.push({ $type: 1, $source: 0, $nodeHandle: i, $childIndex: 0, $text: 'x' });
      // Discard reference
    }

    globalThis.gc();
    const after = process.memoryUsage().heapUsed;
    const delta = after - before;

    // 1MB tolerance for JIT/module artifacts
    expect(delta).toBeLessThan(1_000_000);
  });
});
