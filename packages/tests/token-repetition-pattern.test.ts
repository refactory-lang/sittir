import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('token_repetition_pattern', () => {
  it('should create a token_repetition_pattern node via builder', () => {
    const builder = ir.token_repetition_pattern();
    const node = builder.build();
    expect(node.kind).toBe('token_repetition_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.token_repetition_pattern();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
