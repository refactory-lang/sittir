import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('struct_pattern', () => {
  it('should create a struct_pattern node via builder', () => {
    const builder = ir.struct_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('struct_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.struct_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
