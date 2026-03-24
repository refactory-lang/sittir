import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('decorator', () => {
  it('should create a decorator node via builder', () => {
    const builder = ir.decorator(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('decorator');
  });

  it('should render without throwing', () => {
    const builder = ir.decorator(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
