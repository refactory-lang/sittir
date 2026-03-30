import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('parenthesized_type', () => {
  it('should create a parenthesized_type node via builder', () => {
    const builder = ir.parenthesized_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('parenthesized_type');
  });

  it('should render without throwing', () => {
    const builder = ir.parenthesized_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
