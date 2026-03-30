import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('optional_parameter', () => {
  it('should create a optional_parameter node via builder', () => {
    const builder = ir.optional_parameter();
    const node = builder.build();
    expect(node.kind).toBe('optional_parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.optional_parameter();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
