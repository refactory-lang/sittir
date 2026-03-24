import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('template_string', () => {
  it('should create a template_string node via builder', () => {
    const builder = ir.template_string();
    const node = builder.build();
    expect(node.kind).toBe('template_string');
  });

  it('should render without throwing', () => {
    const builder = ir.template_string();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
