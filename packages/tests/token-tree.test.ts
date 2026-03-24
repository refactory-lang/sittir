import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('token_tree', () => {
  it('should create a token_tree node via builder', () => {
    const builder = ir.token_tree();
    const node = builder.build();
    expect(node.kind).toBe('token_tree');
  });

  it('should render without throwing', () => {
    const builder = ir.token_tree();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
