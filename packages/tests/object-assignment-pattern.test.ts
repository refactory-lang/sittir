import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('object_assignment_pattern', () => {
  it('should create a object_assignment_pattern node via builder', () => {
    const builder = ir.object_assignment_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('object_assignment_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.object_assignment_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
