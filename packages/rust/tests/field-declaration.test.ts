import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('field_declaration', () => {
  it('should create a field_declaration node via builder', () => {
    const builder = ir.fieldDeclaration(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('field_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.fieldDeclaration(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
