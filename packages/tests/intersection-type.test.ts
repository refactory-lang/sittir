import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('intersection_type', () => {
  it('should create a intersection_type node via builder', () => {
    const builder = ir.intersection_type([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('intersection_type');
  });

  it('should render without throwing', () => {
    const builder = ir.intersection_type([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
