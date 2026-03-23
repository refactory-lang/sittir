import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('field_declaration_list', () => {
  it('should build with correct kind', () => {
    const builder = ir.fieldDeclarationList();
    const node = builder.build();
    expect(node.kind).toBe('field_declaration_list');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.fieldDeclarationList();
    const cst = builder.toCST();
    expect(cst.type).toBe('field_declaration_list');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.fieldDeclarationList();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
