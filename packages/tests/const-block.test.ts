import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('const_block', () => {
  it('should create a const_block node via builder', () => {
    const builder = ir.const_block(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('const_block');
  });

  it('should render without throwing', () => {
    const builder = ir.const_block(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
