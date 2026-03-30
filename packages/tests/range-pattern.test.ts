import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('range_pattern', () => {
  it('should create a range_pattern node via builder', () => {
    const builder = ir.range_pattern();
    const node = builder.build();
    expect(node.kind).toBe('range_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.range_pattern();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
