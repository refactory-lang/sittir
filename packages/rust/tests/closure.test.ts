import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('closure_expression', () => {
  it('should create a closure_expression node via builder', () => {
    const builder = ir.closure(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('closure_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.closure(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
