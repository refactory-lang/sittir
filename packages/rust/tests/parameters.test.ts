import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('parameters', () => {
  it('should create a parameters node via builder', () => {
    const builder = ir.parameters();
    const node = builder.build();
    expect(node.kind).toBe('parameters');
  });

  it('should render without throwing', () => {
    const builder = ir.parameters();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
