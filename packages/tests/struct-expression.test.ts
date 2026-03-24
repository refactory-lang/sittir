import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('struct_expression', () => {
  it('should create a struct_expression node via builder', () => {
    const builder = ir.structExpression(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('struct_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.structExpression(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
