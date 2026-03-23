import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('match_block', () => {
  it('should build with correct kind', () => {
    const builder = ir.match_block();
    const node = builder.build();
    expect(node.kind).toBe('match_block');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.match_block();
    const source = builder.renderImpl();
    expect(source).toContain('{');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.match_block();
    const cst = builder.toCST();
    expect(cst.type).toBe('match_block');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.match_block();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
