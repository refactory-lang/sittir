import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('asserts_annotation', () => {
  it('should create a asserts_annotation node via builder', () => {
    const builder = ir.asserts_annotation(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('asserts_annotation');
  });

  it('should render without throwing', () => {
    const builder = ir.asserts_annotation(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
