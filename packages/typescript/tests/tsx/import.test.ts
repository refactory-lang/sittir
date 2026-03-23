import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('import_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.import();
    const node = builder.build();
    expect(node.kind).toBe('import_statement');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.import();
    const cst = builder.toCST();
    expect(cst.type).toBe('import_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.import();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
