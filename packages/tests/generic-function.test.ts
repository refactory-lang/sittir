import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generic_function', () => {
  it('should create a generic_function node via builder', () => {
    const builder = ir.generic_function(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('generic_function');
  });

  it('should render without throwing', () => {
    const builder = ir.generic_function(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
