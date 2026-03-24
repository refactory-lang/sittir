import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('or_pattern', () => {
  it('should create a or_pattern node via builder', () => {
    const builder = ir.or_pattern([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('or_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.or_pattern([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
