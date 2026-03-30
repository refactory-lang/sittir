import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('inner_attribute_item', () => {
  it('should create a inner_attribute_item node via builder', () => {
    const builder = ir.inner_attribute(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('inner_attribute_item');
  });

  it('should render without throwing', () => {
    const builder = ir.inner_attribute(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
