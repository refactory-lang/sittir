import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('field_definition', () => {
  it('should build with correct kind', () => {
    const builder = ir.fieldDefinition(ir.propertyIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('field_definition');
    expect((node as any).property).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.fieldDefinition(ir.propertyIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('field_definition');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.fieldDefinition(ir.propertyIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
