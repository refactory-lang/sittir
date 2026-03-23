import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('tuple_type', () => {
  it('should create a tuple_type node via builder', () => {
    const builder = ir.tuple_type([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('tuple_type');
  });

  it('should render without throwing', () => {
    const builder = ir.tuple_type([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
