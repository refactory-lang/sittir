import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_wildcard', () => {
  it('should create a use_wildcard node via builder', () => {
    const builder = ir.use_wildcard();
    const node = builder.build();
    expect(node.kind).toBe('use_wildcard');
  });

  it('should render without throwing', () => {
    const builder = ir.use_wildcard();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
