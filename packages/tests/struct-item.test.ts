import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('struct_item', () => {
  it('should create a struct_item node via builder', () => {
    const builder = ir.structItem(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('struct_item');
  });

  it('should render without throwing', () => {
    const builder = ir.structItem(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
