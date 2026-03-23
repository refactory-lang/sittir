import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('macro_rule', () => {
  it('should build with correct kind', () => {
    const builder = ir.macroRule(ir.tokenTreePattern());
    const node = builder.build();
    expect(node.kind).toBe('macro_rule');
    expect((node as any).left).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.macroRule(ir.tokenTreePattern());
    const source = builder.renderImpl();
    expect(source).toContain('=>');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.macroRule(ir.tokenTreePattern());
    const cst = builder.toCST();
    expect(cst.type).toBe('macro_rule');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.macroRule(ir.tokenTreePattern());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
