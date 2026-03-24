import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('tuple_pattern', () => {
  it('should create a tuple_pattern node via builder', () => {
    const builder = ir.tuple_pattern();
    const node = builder.build();
    expect(node.kind).toBe('tuple_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.tuple_pattern();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
