import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('reference_pattern', () => {
  it('should create a reference_pattern node via builder', () => {
    const builder = ir.reference_pattern([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('reference_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.reference_pattern([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
