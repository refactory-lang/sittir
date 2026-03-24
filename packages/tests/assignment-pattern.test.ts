import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('assignment_pattern', () => {
  it('should create a assignment_pattern node via builder', () => {
    const builder = ir.assignment_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('assignment_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.assignment_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
