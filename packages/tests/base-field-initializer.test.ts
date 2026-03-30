import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('base_field_initializer', () => {
  it('should create a base_field_initializer node via builder', () => {
    const builder = ir.base_field_initializer(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('base_field_initializer');
  });

  it('should render without throwing', () => {
    const builder = ir.base_field_initializer(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
