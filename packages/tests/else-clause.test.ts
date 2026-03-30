import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('else_clause', () => {
  it('should create a else_clause node via builder', () => {
    const builder = ir.else_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('else_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.else_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
