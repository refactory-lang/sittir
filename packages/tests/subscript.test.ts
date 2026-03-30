import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('subscript_expression', () => {
  it('should create a subscript_expression node via builder', () => {
    const builder = ir.subscript(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('subscript_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.subscript(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
