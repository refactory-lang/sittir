import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('catch_clause', () => {
  it('should create a catch_clause node via builder', () => {
    const builder = ir.catch_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('catch_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.catch_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
