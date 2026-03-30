import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('qualified_type', () => {
  it('should create a qualified_type node via builder', () => {
    const builder = ir.qualified_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('qualified_type');
  });

  it('should render without throwing', () => {
    const builder = ir.qualified_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
