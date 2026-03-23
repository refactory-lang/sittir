import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('closure_parameters', () => {
  it('should create a closure_parameters node via builder', () => {
    const builder = ir.closure_parameters();
    const node = builder.build();
    expect(node.kind).toBe('closure_parameters');
  });

  it('should render without throwing', () => {
    const builder = ir.closure_parameters();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
