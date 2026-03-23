import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('higher_ranked_trait_bound', () => {
  it('should build with correct kind', () => {
    const builder = ir.higherRankedTraitBound(ir.typeParameters(ir.metavariable('test')));
    const node = builder.build();
    expect(node.kind).toBe('higher_ranked_trait_bound');
    expect((node as any).typeParameters).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.higherRankedTraitBound(ir.typeParameters(ir.metavariable('test')));
    const source = builder.renderImpl();
    expect(source).toContain('for');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.higherRankedTraitBound(ir.typeParameters(ir.metavariable('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('higher_ranked_trait_bound');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.higherRankedTraitBound(ir.typeParameters(ir.metavariable('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
