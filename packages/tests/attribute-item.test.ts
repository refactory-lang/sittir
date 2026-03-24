import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('attribute_item', () => {
  it('should create a attribute_item node via builder', () => {
    const builder = ir.attributeItem(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('attribute_item');
  });

  it('should render without throwing', () => {
    const builder = ir.attributeItem(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
