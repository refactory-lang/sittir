import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('array_pattern', () => {
  it('should create a array_pattern node via builder', () => {
    const builder = ir.array_pattern();
    const node = builder.build();
    expect(node.kind).toBe('array_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.array_pattern();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
