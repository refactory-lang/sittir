import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('tuple_expression', () => {
  it('should create a tuple_expression node via builder', () => {
    const builder = ir.tuple([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('tuple_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.tuple([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
