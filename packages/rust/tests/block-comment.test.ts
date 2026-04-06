import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('block_comment', () => {
  it('should build with correct kind', () => {
    const builder = ir.block_comment();
    const node = builder.build();
    expect(node.kind).toBe('block_comment');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.block_comment();
    const source = builder.renderImpl();
    expect(source).toContain('/*');
    expect(source).toContain('*/');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.block_comment();
    const cst = builder.toCST();
    expect(cst.type).toBe('block_comment');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.block_comment();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
