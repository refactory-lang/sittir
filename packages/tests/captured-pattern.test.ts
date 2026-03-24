import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('captured_pattern', () => {
  it('should create a captured_pattern node via builder', () => {
    const builder = ir.captured_pattern([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('captured_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.captured_pattern([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
