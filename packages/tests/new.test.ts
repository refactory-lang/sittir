import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('new_expression', () => {
  it('should create a new_expression node via builder', () => {
    const builder = ir.new(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('new_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.new(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
