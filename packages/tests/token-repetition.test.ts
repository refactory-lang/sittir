import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('token_repetition', () => {
  it('should create a token_repetition node via builder', () => {
    const builder = ir.token_repetition();
    const node = builder.build();
    expect(node.kind).toBe('token_repetition');
  });

  it('should render without throwing', () => {
    const builder = ir.token_repetition();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
