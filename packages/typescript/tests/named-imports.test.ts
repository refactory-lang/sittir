import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('named_imports', () => {
  it('should build with correct kind', () => {
    const builder = ir.named_imports();
    const node = builder.build();
    expect(node.kind).toBe('named_imports');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.named_imports();
    const source = builder.renderImpl();
    expect(source).toContain('{');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.named_imports();
    const cst = builder.toCST();
    expect(cst.type).toBe('named_imports');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.named_imports();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
