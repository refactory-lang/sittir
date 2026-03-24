import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generic_type_with_turbofish', () => {
  it('should build with correct kind', () => {
    const builder = ir.genericTypeWithTurbofish(ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('generic_type_with_turbofish');
    expect((node as any).type).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.genericTypeWithTurbofish(ir.typeIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('::');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.genericTypeWithTurbofish(ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('generic_type_with_turbofish');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.genericTypeWithTurbofish(ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
