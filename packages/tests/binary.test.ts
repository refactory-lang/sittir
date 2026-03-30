import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('binary_expression', () => {
  it('should create a binary_expression node via builder', () => {
    const builder = ir.binary(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('binary_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.binary(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
