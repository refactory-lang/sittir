import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('slice_pattern', () => {
  it('should create a slice_pattern node via builder', () => {
    const builder = ir.slice_pattern();
    const node = builder.build();
    expect(node.kind).toBe('slice_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.slice_pattern();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
