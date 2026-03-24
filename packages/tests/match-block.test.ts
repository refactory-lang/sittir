import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('match_block', () => {
  it('should create a match_block node via builder', () => {
    const builder = ir.match_block();
    const node = builder.build();
    expect(node.kind).toBe('match_block');
  });

  it('should render without throwing', () => {
    const builder = ir.match_block();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
