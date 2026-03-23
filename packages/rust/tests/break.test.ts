import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('break_expression', () => {
  it('should create a break_expression node via builder', () => {
    const builder = ir.break();
    const node = builder.build();
    expect(node.kind).toBe('break_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.break();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
