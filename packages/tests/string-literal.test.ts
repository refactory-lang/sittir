import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('string_literal', () => {
  it('should create a string_literal node via builder', () => {
    const builder = ir.string_literal();
    const node = builder.build();
    expect(node.kind).toBe('string_literal');
  });

  it('should render without throwing', () => {
    const builder = ir.string_literal();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
