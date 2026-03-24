import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('field_expression', () => {
  it('should create a field_expression node via builder', () => {
    const builder = ir.fieldExpression(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('field_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.fieldExpression(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
