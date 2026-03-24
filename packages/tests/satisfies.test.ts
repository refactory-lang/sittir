import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('satisfies_expression', () => {
  it('should create a satisfies_expression node via builder', () => {
    const builder = ir.satisfies([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('satisfies_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.satisfies([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
