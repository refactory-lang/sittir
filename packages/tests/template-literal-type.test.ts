import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('template_literal_type', () => {
  it('should create a template_literal_type node via builder', () => {
    const builder = ir.template_literal_type();
    const node = builder.build();
    expect(node.kind).toBe('template_literal_type');
  });

  it('should render without throwing', () => {
    const builder = ir.template_literal_type();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
