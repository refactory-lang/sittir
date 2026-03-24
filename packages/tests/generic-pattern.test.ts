import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generic_pattern', () => {
  it('should create a generic_pattern node via builder', () => {
    const builder = ir.generic_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('generic_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.generic_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
