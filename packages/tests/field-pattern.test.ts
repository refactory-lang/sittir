import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('field_pattern', () => {
  it('should create a field_pattern node via builder', () => {
    const builder = ir.field_pattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('field_pattern');
  });

  it('should render without throwing', () => {
    const builder = ir.field_pattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
