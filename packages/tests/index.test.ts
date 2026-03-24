import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('index_expression', () => {
  it('should create a index_expression node via builder', () => {
    const builder = ir.index([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('index_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.index([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
