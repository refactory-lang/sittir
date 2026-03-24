import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('lexical_declaration', () => {
  it('should create a lexical_declaration node via builder', () => {
    const builder = ir.lexical(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('lexical_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.lexical(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
