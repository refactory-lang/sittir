import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('negative_literal', () => {
  it('should create a negative_literal node via builder', () => {
    const builder = ir.negative_literal(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('negative_literal');
  });

  it('should render without throwing', () => {
    const builder = ir.negative_literal(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
