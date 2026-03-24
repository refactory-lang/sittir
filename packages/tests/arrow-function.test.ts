import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('arrow_function', () => {
  it('should create a arrow_function node via builder', () => {
    const builder = ir.arrow_function(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('arrow_function');
  });

  it('should render without throwing', () => {
    const builder = ir.arrow_function(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
