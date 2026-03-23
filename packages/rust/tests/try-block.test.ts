import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('try_block', () => {
  it('should create a try_block node via builder', () => {
    const builder = ir.try_block(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('try_block');
  });

  it('should render without throwing', () => {
    const builder = ir.try_block(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
