import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('variable_declaration', () => {
  it('should create a variable_declaration node via builder', () => {
    const builder = ir.variable([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('variable_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.variable([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
