import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('tuple_struct_pattern', () => {
  it('should create a tuple_struct_pattern node via builder', () => {
    const builder = ir.tuple_struct_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('tuple_struct_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.tuple_struct_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
