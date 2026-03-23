import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('sequence_expression', () => {
  it('should create a sequence_expression node via builder', () => {
    const builder = ir.sequence([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('sequence_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.sequence([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
