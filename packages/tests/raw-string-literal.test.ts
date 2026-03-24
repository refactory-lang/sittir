import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('raw_string_literal', () => {
  it('should create a raw_string_literal node via builder', () => {
    const builder = ir.raw_string_literal(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('raw_string_literal');
  });

  it('should render without throwing', () => {
    const builder = ir.raw_string_literal(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
