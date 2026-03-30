import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_as_clause', () => {
  it('should create a use_as_clause node via builder', () => {
    const builder = ir.use_as_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('use_as_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.use_as_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
