import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('gen_block', () => {
  it('should create a gen_block node via builder', () => {
    const builder = ir.gen_block(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('gen_block');
  });

  it('should render without throwing', () => {
    const builder = ir.gen_block(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
