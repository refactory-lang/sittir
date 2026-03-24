import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_item', () => {
  it('should create a function_item node via builder', () => {
    const builder = ir.fn(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('function_item');
  });

  it('should render without throwing', () => {
    const builder = ir.fn(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
