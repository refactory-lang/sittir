import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('extern_crate_declaration', () => {
  it('should create a extern_crate_declaration node via builder', () => {
    const builder = ir.extern_crate(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('extern_crate_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.extern_crate(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
