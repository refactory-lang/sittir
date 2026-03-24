import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('mut_pattern', () => {
  it('should create a mut_pattern node via builder', () => {
    const builder = ir.mut_pattern([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('mut_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.mut_pattern([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
