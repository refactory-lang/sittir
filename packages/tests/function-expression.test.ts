import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_expression', () => {
  it('should create a function_expression node via builder', () => {
    const builder = ir.functionExpression(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('function_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.functionExpression(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
