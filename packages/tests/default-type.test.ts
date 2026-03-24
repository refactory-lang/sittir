import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('default_type', () => {
  it('should create a default_type node via builder', () => {
    const builder = ir.default_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('default_type');
  });

  it('should render without throwing', () => {
    const builder = ir.default_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
