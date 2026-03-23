import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('switch_body', () => {
  it('should build with correct kind', () => {
    const builder = ir.switch_body();
    const node = builder.build();
    expect(node.kind).toBe('switch_body');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.switch_body();
    const cst = builder.toCST();
    expect(cst.type).toBe('switch_body');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.switch_body();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
