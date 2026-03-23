import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('assignment_expression', () => {
  it('should create a assignment_expression node via builder', () => {
    const builder = ir.assignment(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('assignment_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.assignment(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
