import { describe, it, expect } from 'vitest';
import { emitIndex } from '../../../src/emitters/index-file.ts';

describe('emitIndex', () => {
  it('should re-export types, builders, and @sittir/types base classes', () => {
    const source = emitIndex({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
    expect(source).toContain("from './types.js'");
    expect(source).toContain("from './builder.js'");
    expect(source).toContain('ir');
    expect(source).toContain("Builder");
    expect(source).toContain("LeafBuilder");
    expect(source).toContain("RenderContext");
    // Should NOT export eliminated files
    expect(source).not.toContain("render.js");
    expect(source).not.toContain("validate.js");
    expect(source).not.toContain("validate-fast.js");
    expect(source).not.toContain("render-valid.js");
  });
});
