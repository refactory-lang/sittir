import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('finally_clause', () => {
  it('should create a finally_clause node via builder', () => {
    const builder = ir.finally_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('finally_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.finally_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
