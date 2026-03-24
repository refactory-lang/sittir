import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('export_specifier', () => {
  it('should create a export_specifier node via builder', () => {
    const builder = ir.export_specifier(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('export_specifier');
  });

  it('should render without throwing', () => {
    const builder = ir.export_specifier(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
