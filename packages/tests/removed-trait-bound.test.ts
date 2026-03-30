import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('removed_trait_bound', () => {
  it('should create a removed_trait_bound node via builder', () => {
    const builder = ir.removed_trait_bound(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('removed_trait_bound');
  });

  it('should render without throwing', () => {
    const builder = ir.removed_trait_bound(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
