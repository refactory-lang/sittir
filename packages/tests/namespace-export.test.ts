import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('namespace_export', () => {
  it('should create a namespace_export node via builder', () => {
    const builder = ir.namespace_export(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('namespace_export');
  });

  it('should render without throwing', () => {
    const builder = ir.namespace_export(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
