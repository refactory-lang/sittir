import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('union_type', () => {
  it('should create a union_type node via builder', () => {
    const builder = ir.union_type([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('union_type');
  });

  it('should render without throwing', () => {
    const builder = ir.union_type([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
