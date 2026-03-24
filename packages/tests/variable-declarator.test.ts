import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('variable_declarator', () => {
  it('should create a variable_declarator node via builder', () => {
    const builder = ir.variable_declarator(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('variable_declarator');
  });

  it('should render without throwing', () => {
    const builder = ir.variable_declarator(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
