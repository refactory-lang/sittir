import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('ref_pattern', () => {
  it('should create a ref_pattern node via builder', () => {
    const builder = ir.ref_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('ref_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.ref_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
