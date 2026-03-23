import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('class_static_block', () => {
  it('should build with correct kind', () => {
    const builder = ir.classStaticBlock(ir.statementBlock());
    const node = builder.build();
    expect(node.kind).toBe('class_static_block');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.classStaticBlock(ir.statementBlock());
    const source = builder.renderImpl();
    expect(source).toContain('static');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.classStaticBlock(ir.statementBlock());
    const cst = builder.toCST();
    expect(cst.type).toBe('class_static_block');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.classStaticBlock(ir.statementBlock());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
