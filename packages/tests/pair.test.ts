import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('pair', () => {
  it('should create a pair node via builder', () => {
    const builder = ir.pair(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('pair');
  });

  it('should render without throwing', () => {
    const builder = ir.pair(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
