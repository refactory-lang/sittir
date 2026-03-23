import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('namespace_import', () => {
  it('should create a namespace_import node via builder', () => {
    const builder = ir.namespace_import(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('namespace_import');
  });

  it('should render without throwing', () => {
    const builder = ir.namespace_import(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
