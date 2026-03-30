import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('augmented_assignment_expression', () => {
  it('should create a augmented_assignment_expression node via builder', () => {
    const builder = ir.augmented_assignment(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('augmented_assignment_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.augmented_assignment(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
