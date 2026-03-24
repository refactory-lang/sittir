import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('template_type', () => {
  it('should create a template_type node via builder', () => {
    const builder = ir.template_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('template_type');
  });

  it('should render without throwing', () => {
    const builder = ir.template_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
