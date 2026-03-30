import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('computed_property_name', () => {
  it('should create a computed_property_name node via builder', () => {
    const builder = ir.computed_property_name(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('computed_property_name');
  });

  it('should render without throwing', () => {
    const builder = ir.computed_property_name(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
