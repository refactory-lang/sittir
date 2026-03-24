import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('compound_assignment_expr', () => {
  it('should create a compound_assignment_expr node via builder', () => {
    const builder = ir.compound_assignment_expr(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('compound_assignment_expr');
  });

  it('should render without throwing', () => {
    const builder = ir.compound_assignment_expr(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
