import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_from_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.importFromStatement(ir.relativeImport(ir.importPrefix('test')));
    const node = builder.build();
    expect(node.kind).toBe('import_from_statement');
    expect((node as any).moduleName).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.importFromStatement(ir.relativeImport(ir.importPrefix('test')));
    const source = builder.renderImpl();
    expect(source).toContain('from');
    expect(source).toContain('import');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.importFromStatement(ir.relativeImport(ir.importPrefix('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('import_from_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.importFromStatement(ir.relativeImport(ir.importPrefix('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
