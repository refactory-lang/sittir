import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('mapped_type_clause', () => {
  it('should create a mapped_type_clause node via builder', () => {
    const builder = ir.mapped_type_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('mapped_type_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.mapped_type_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
