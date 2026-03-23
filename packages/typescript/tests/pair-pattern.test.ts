import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('pair_pattern', () => {
  it('should create a pair_pattern node via builder', () => {
    const builder = ir.pair_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('pair_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.pair_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
