import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('try_expression', () => {
  it('should create a try_expression node via builder', () => {
    const builder = ir.try(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('try_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.try(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
