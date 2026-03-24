import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('instantiation_expression', () => {
  it('should create a instantiation_expression node via builder', () => {
    const builder = ir.instantiation(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('instantiation_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.instantiation(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
