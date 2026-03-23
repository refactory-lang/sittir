import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('rest_type', () => {
  it('should create a rest_type node via builder', () => {
    const builder = ir.rest_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('rest_type');
  });

  it('should render without throwing', () => {
    const builder = ir.rest_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
