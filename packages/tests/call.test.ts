import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('call_expression', () => {
  it('should create a call_expression node via builder', () => {
    const builder = ir.call(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('call_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.call(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
