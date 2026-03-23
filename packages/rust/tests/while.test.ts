import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('while_expression', () => {
  it('should create a while_expression node via builder', () => {
    const builder = ir.while(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('while_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.while(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
