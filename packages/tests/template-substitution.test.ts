import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('template_substitution', () => {
  it('should create a template_substitution node via builder', () => {
    const builder = ir.template_substitution(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('template_substitution');
  });

  it('should render without throwing', () => {
    const builder = ir.template_substitution(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
