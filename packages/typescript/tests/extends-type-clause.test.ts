import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('extends_type_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.extendsTypeClause();
    const node = builder.build();
    expect(node.kind).toBe('extends_type_clause');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.extendsTypeClause();
    const cst = builder.toCST();
    expect(cst.type).toBe('extends_type_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.extendsTypeClause();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
