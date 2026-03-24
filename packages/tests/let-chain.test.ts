import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('let_chain', () => {
  it('should create a let_chain node via builder', () => {
    const builder = ir.let_chain([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('let_chain');
  });

  it('should render without throwing', () => {
    const builder = ir.let_chain([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
