import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('reference_expression', () => {
  it('should create a reference_expression node via builder', () => {
    const builder = ir.reference(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('reference_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.reference(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
