import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_modifiers', () => {
  it('should create a function_modifiers node via builder', () => {
    const builder = ir.function_modifiers();
    const node = builder.build();
    expect(node.kind).toBe('function_modifiers');
  });

  it('should render without throwing', () => {
    const builder = ir.function_modifiers();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
