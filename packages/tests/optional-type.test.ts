import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('optional_type', () => {
  it('should create a optional_type node via builder', () => {
    const builder = ir.optional_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('optional_type');
  });

  it('should render without throwing', () => {
    const builder = ir.optional_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
