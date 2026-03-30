import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('formal_parameters', () => {
  it('should create a formal_parameters node via builder', () => {
    const builder = ir.formal_parameters();
    const node = builder.build();
    expect(node.kind).toBe('formal_parameters');
  });

  it('should render without throwing', () => {
    const builder = ir.formal_parameters();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
