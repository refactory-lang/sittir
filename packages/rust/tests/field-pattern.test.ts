import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('field_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.field_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('field_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.field_pattern(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('field_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.field_pattern(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
