import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('required_parameter', () => {
  it('should create a required_parameter node via builder', () => {
    const builder = ir.required_parameter();
    const node = builder.build();
    expect(node.kind).toBe('required_parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.required_parameter();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
