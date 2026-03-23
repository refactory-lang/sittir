import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.import_clause(ir.identifier('a'), ir.identifier('b'));
    const node = builder.build();
    expect(node.kind).toBe('import_clause');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.import_clause(ir.identifier('a'), ir.identifier('b'));
    const cst = builder.toCST();
    expect(cst.type).toBe('import_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.import_clause(ir.identifier('a'), ir.identifier('b'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
