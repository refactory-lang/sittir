import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('union_item', () => {
  it('should create a union_item node via builder', () => {
    const builder = ir.union(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('union_item');
  });

  it('should render without throwing', () => {
    const builder = ir.union(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
