import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('trait_bounds', () => {
  it('should build with correct kind', () => {
    const builder = ir.traitBounds(ir.metavariable('test'), ir.metavariable('test'));
    const node = builder.build();
    expect(node.kind).toBe('trait_bounds');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.traitBounds(ir.metavariable('test'), ir.metavariable('test'));
    const source = builder.renderImpl();
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.traitBounds(ir.metavariable('test'), ir.metavariable('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('trait_bounds');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.traitBounds(ir.metavariable('test'), ir.metavariable('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
