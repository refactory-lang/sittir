import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('non_null_expression', () => {
  it('should create a non_null_expression node via builder', () => {
    const builder = ir.non_null(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('non_null_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.non_null(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
