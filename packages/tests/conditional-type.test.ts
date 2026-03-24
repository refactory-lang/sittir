import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('conditional_type', () => {
  it('should create a conditional_type node via builder', () => {
    const builder = ir.conditional_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('conditional_type');
  });

  it('should render without throwing', () => {
    const builder = ir.conditional_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
