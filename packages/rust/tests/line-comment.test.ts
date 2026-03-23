import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('line_comment', () => {
  it('should create a line_comment node via builder', () => {
    const builder = ir.line_comment();
    const node = builder.build();
    expect(node.kind).toBe('line_comment');
  });

  it('should render without throwing', () => {
    const builder = ir.line_comment();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
