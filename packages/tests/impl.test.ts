import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('impl_item', () => {
  it('should create a impl_item node via builder', () => {
    const builder = ir.impl(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('impl_item');
  });

  it('should render without throwing', () => {
    const builder = ir.impl(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
