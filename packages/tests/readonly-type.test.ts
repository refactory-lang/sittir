import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('readonly_type', () => {
  it('should create a readonly_type node via builder', () => {
    const builder = ir.readonly_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('readonly_type');
  });

  it('should render without throwing', () => {
    const builder = ir.readonly_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
