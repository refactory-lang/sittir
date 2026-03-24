import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('unsafe_block', () => {
  it('should create a unsafe_block node via builder', () => {
    const builder = ir.unsafe_block(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('unsafe_block');
  });

  it('should render without throwing', () => {
    const builder = ir.unsafe_block(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
