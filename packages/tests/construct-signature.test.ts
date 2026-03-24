import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('construct_signature', () => {
  it('should create a construct_signature node via builder', () => {
    const builder = ir.construct_signature(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('construct_signature');
  });

  it('should render without throwing', () => {
    const builder = ir.construct_signature(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
