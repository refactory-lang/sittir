import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('index_signature', () => {
  it('should create a index_signature node via builder', () => {
    const builder = ir.index_signature(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('index_signature');
  });

  it('should render without throwing', () => {
    const builder = ir.index_signature(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
