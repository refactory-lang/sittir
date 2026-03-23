import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('public_field_definition', () => {
  it('should build with correct kind', () => {
    const builder = ir.public_field_definition(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('public_field_definition');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.public_field_definition(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('public_field_definition');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.public_field_definition(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
