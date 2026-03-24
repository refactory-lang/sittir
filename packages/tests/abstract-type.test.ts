import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('abstract_type', () => {
  it('should create a abstract_type node via builder', () => {
    const builder = ir.abstract_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('abstract_type');
  });

  it('should render without throwing', () => {
    const builder = ir.abstract_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
