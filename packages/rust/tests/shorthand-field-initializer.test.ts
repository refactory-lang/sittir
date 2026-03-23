import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('shorthand_field_initializer', () => {
  it('should build with correct kind', () => {
    const builder = ir.shorthandFieldInitializer(ir.identifier('test'), ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('shorthand_field_initializer');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.shorthandFieldInitializer(ir.identifier('test'), ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('shorthand_field_initializer');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.shorthandFieldInitializer(ir.identifier('test'), ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
