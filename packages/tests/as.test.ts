import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('as_expression', () => {
  it('should create a as_expression node via builder', () => {
    const builder = ir.as([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('as_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.as([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
