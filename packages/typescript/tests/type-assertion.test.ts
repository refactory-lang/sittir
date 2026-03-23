import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_assertion', () => {
  it('should build with correct kind', () => {
    const builder = ir.typeAssertion(ir.typeArguments(ir.callExpression(ir.import('test'))), ir.typeArguments(ir.callExpression(ir.import('test'))));
    const node = builder.build();
    expect(node.kind).toBe('type_assertion');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.typeAssertion(ir.typeArguments(ir.callExpression(ir.import('test'))), ir.typeArguments(ir.callExpression(ir.import('test'))));
    const cst = builder.toCST();
    expect(cst.type).toBe('type_assertion');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.typeAssertion(ir.typeArguments(ir.callExpression(ir.import('test'))), ir.typeArguments(ir.callExpression(ir.import('test'))));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
