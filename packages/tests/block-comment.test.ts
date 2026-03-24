import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('block_comment', () => {
  it('should create a block_comment node via builder', () => {
    const builder = ir.block_comment();
    const node = builder.build();
    expect(node.kind).toBe('block_comment');
  });

  it('should render without throwing', () => {
    const builder = ir.block_comment();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
