import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('async_block', () => {
  it('should create a async_block node via builder', () => {
    const builder = ir.async_block(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('async_block');
  });

  it('should render without throwing', () => {
    const builder = ir.async_block(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
