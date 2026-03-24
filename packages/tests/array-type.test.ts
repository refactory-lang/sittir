import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('array_type', () => {
  it('should create a array_type node via builder', () => {
    const builder = ir.array_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('array_type');
  });

  it('should render without throwing', () => {
    const builder = ir.array_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
