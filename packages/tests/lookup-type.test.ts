import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('lookup_type', () => {
  it('should create a lookup_type node via builder', () => {
    const builder = ir.lookup_type([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('lookup_type');
  });

  it('should render without throwing', () => {
    const builder = ir.lookup_type([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
