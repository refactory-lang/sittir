import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_alias', () => {
  it('should build with correct kind', () => {
    const builder = ir.import_alias([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('import_alias');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.import_alias([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(source).toContain('import');
    expect(source).toContain('=');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.import_alias([ir.identifier('test')]);
    const cst = builder.toCST();
    expect(cst.type).toBe('import_alias');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.import_alias([ir.identifier('test')]);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
