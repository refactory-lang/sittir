import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('dynamic_type', () => {
  it('should create a dynamic_type node via builder', () => {
    const builder = ir.dynamic_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('dynamic_type');
  });

  it('should render without throwing', () => {
    const builder = ir.dynamic_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
