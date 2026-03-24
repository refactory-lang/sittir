import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('source_file', () => {
  it('should build with correct kind', () => {
    const builder = ir.sourceFile();
    const node = builder.build();
    expect(node.kind).toBe('source_file');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.sourceFile();
    const cst = builder.toCST();
    expect(cst.type).toBe('source_file');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.sourceFile();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
