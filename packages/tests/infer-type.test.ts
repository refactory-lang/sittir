import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('infer_type', () => {
  it('should create a infer_type node via builder', () => {
    const builder = ir.infer_type([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('infer_type');
  });

  it('should render without throwing', () => {
    const builder = ir.infer_type([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
