import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('bounded_type', () => {
  it('should create a bounded_type node via builder', () => {
    const builder = ir.bounded_type([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('bounded_type');
  });

  it('should render without throwing', () => {
    const builder = ir.bounded_type([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
