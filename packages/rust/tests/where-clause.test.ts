import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('where_clause', () => {
  it('should create a where_clause node via builder', () => {
    const builder = ir.where_clause();
    const node = builder.build();
    expect(node.kind).toBe('where_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.where_clause();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
