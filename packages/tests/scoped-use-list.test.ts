import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('scoped_use_list', () => {
  it('should create a scoped_use_list node via builder', () => {
    const builder = ir.scoped_use_list(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('scoped_use_list');
  });

  it('should render without throwing', () => {
    const builder = ir.scoped_use_list(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
