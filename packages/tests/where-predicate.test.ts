import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('where_predicate', () => {
  it('should create a where_predicate node via builder', () => {
    const builder = ir.where_predicate(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('where_predicate');
  });

  it('should render without throwing', () => {
    const builder = ir.where_predicate(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
