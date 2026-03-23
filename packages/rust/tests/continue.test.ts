import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('continue_expression', () => {
  it('should create a continue_expression node via builder', () => {
    const builder = ir.continue();
    const node = builder.build();
    expect(node.kind).toBe('continue_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.continue();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
