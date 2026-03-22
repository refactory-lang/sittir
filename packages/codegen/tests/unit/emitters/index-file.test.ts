import { describe, it, expect } from 'vitest';
import { emitIndex } from '../../../src/emitters/index-file.ts';

describe('emitIndex', () => {
  it('should re-export types, builders, render, validate, fluent', () => {
    const source = emitIndex({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
    expect(source).toContain("from './types.js'");
    expect(source).toContain("from './render.js'");
    expect(source).toContain("from './validate-fast.js'");
    expect(source).toContain("from './fluent.js'");
    expect(source).toContain('structItem');
    expect(source).toContain('functionItem');
    expect(source).toContain('ir');
  });
});
