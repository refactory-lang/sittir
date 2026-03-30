import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('array', () => {
  it('should create a array node via builder', () => {
    const builder = ir.array();
    const node = builder.build();
    expect(node.kind).toBe('array');
  });

  it('should render without throwing', () => {
    const builder = ir.array();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
