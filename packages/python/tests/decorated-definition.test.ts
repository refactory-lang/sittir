import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('decorated_definition', () => {
  it('should build with correct kind', () => {
    const builder = ir.decoratedDefinition(ir.classDefinition(ir.identifier('test')));
    const node = builder.build();
    expect(node.kind).toBe('decorated_definition');
    expect((node as any).definition).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.decoratedDefinition(ir.classDefinition(ir.identifier('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('decorated_definition');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.decoratedDefinition(ir.classDefinition(ir.identifier('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
