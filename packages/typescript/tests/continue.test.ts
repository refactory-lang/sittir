import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('continue_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.continue();
    const node = builder.build();
    expect(node.kind).toBe('continue_statement');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.continue();
    const source = builder.renderImpl();
    expect(source).toContain('continue');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.continue();
    const cst = builder.toCST();
    expect(cst.type).toBe('continue_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.continue();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
