import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('variadic_parameter', () => {
  it('should create a variadic_parameter node via builder', () => {
    const builder = ir.variadic_parameter();
    const node = builder.build();
    expect(node.kind).toBe('variadic_parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.variadic_parameter();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
