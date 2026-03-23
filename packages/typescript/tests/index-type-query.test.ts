import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('index_type_query', () => {
  it('should build with correct kind', () => {
    const builder = ir.indexTypeQuery(ir.existentialType('test'));
    const node = builder.build();
    expect(node.kind).toBe('index_type_query');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.indexTypeQuery(ir.existentialType('test'));
    const source = builder.renderImpl();
    expect(source).toContain('keyof');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.indexTypeQuery(ir.existentialType('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('index_type_query');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.indexTypeQuery(ir.existentialType('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
