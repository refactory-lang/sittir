import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('implements_clause', () => {
  it('should create a implements_clause node via builder', () => {
    const builder = ir.implements_clause([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('implements_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.implements_clause([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
