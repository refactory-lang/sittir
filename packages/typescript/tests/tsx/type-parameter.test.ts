import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('type_parameter', () => {
  it('should build with correct kind', () => {
    const builder = ir.type_parameter(ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_parameter');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.type_parameter(ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('type_parameter');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.type_parameter(ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
