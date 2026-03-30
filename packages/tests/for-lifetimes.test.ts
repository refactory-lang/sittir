import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('for_lifetimes', () => {
  it('should create a for_lifetimes node via builder', () => {
    const builder = ir.for_lifetimes([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('for_lifetimes');
  });

  it('should render without throwing', () => {
    const builder = ir.for_lifetimes([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
