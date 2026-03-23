import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('labeled_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.labeled(ir.debuggerStatement('test'));
    const node = builder.build();
    expect(node.kind).toBe('labeled_statement');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.labeled(ir.debuggerStatement('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('labeled_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.labeled(ir.debuggerStatement('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
