import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('await_expression', () => {
  it('should create a await_expression node via builder', () => {
    const builder = ir.await(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('await_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.await(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
