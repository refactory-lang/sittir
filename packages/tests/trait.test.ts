import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('trait_item', () => {
  it('should create a trait_item node via builder', () => {
    const builder = ir.trait(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('trait_item');
  });

  it('should render without throwing', () => {
    const builder = ir.trait(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
