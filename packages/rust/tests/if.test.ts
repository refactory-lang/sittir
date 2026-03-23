import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('if_expression', () => {
  it('should create a if_expression node via builder', () => {
    const builder = ir.if(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('if_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.if(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
