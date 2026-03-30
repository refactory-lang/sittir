import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('object_pattern', () => {
  it('should create a object_pattern node via builder', () => {
    const builder = ir.object_pattern();
    const node = builder.build();
    expect(node.kind).toBe('object_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.object_pattern();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
