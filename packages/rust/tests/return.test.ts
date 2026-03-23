import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('return_expression', () => {
  it('should create a return_expression node via builder', () => {
    const builder = ir.return();
    const node = builder.build();
    expect(node.kind).toBe('return_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.return();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
