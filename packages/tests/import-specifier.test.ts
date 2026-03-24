import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_specifier', () => {
  it('should create a import_specifier node via builder', () => {
    const builder = ir.import_specifier(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('import_specifier');
  });

  it('should render without throwing', () => {
    const builder = ir.import_specifier(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
