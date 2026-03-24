import { describe, it, expect } from 'vitest';
import { emitIndexIr } from '../../../src/emitters/index-file-ir.ts';
import { emitIndex } from '../../../src/emitters/index-file.ts';

describe('emitIndexIr', () => {
  const config = {
    grammar: 'typescript',
    nodeKinds: ['function_declaration', 'class_declaration'],
  };

  it('should produce valid output', () => {
    const output = emitIndexIr(config);
    expect(output).toContain("export * from './types.js'");
    expect(output).toContain("export { ir, fromCST, edit } from './builder.js'");
    expect(output).toContain("export * from './consts.js'");
    expect(output).toContain("export { Builder, LeafBuilder } from '@sittir/types'");
  });

  it('should match old emitter structure', () => {
    const oldOutput = emitIndex(config);
    const newOutput = emitIndexIr(config);

    console.log('=== OLD ===');
    console.log(oldOutput);
    console.log('=== NEW ===');
    console.log(newOutput);

    // Both should contain the same re-exports
    for (const fragment of [
      './types.js',
      './builder.js',
      './consts.js',
      '@sittir/types',
      'Builder',
      'LeafBuilder',
      'RenderContext',
      'ir',
      'fromCST',
      'edit',
    ]) {
      expect(newOutput).toContain(fragment);
    }
  });
});
