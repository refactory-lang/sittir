import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_attribute', () => {
  it('should build with correct kind', () => {
    const builder = ir.importAttribute(ir.object());
    const node = builder.build();
    expect(node.kind).toBe('import_attribute');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.importAttribute(ir.object());
    const cst = builder.toCST();
    expect(cst.type).toBe('import_attribute');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.importAttribute(ir.object());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
