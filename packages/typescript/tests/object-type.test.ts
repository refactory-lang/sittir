import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('object_type', () => {
  it('should create a object_type node via builder', () => {
    const builder = ir.object_type();
    const node = builder.build();
    expect(node.kind).toBe('object_type');
  });

  it('should render without throwing', () => {
    const builder = ir.object_type();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
