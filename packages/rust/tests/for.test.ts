import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('for_expression', () => {
  it('should create a for_expression node via builder', () => {
    const builder = ir.for(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('for_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.for(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
