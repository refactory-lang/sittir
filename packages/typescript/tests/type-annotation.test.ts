import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_annotation', () => {
  it('should build with correct kind', () => {
    const builder = ir.typeAnnotation(ir.callExpression(ir.import('test')));
    const node = builder.build();
    expect(node.kind).toBe('type_annotation');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.typeAnnotation(ir.callExpression(ir.import('test')));
    const source = builder.renderImpl();
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.typeAnnotation(ir.callExpression(ir.import('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('type_annotation');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.typeAnnotation(ir.callExpression(ir.import('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
