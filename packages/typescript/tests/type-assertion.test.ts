import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_assertion', () => {
  it('should build with correct kind', () => {
    const builder = ir.type_assertion([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('type_assertion');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.type_assertion([ir.identifier('test')]);
    const cst = builder.toCST();
    expect(cst.type).toBe('type_assertion');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.type_assertion([ir.identifier('test')]);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
