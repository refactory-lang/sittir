import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('named_imports', () => {
  it('should build with correct kind', () => {
    const builder = ir.namedImports();
    const node = builder.build();
    expect(node.kind).toBe('named_imports');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.namedImports();
    const cst = builder.toCST();
    expect(cst.type).toBe('named_imports');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.namedImports();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
