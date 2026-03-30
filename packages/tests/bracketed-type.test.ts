import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('bracketed_type', () => {
  it('should create a bracketed_type node via builder', () => {
    const builder = ir.bracketed_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('bracketed_type');
  });

  it('should render without throwing', () => {
    const builder = ir.bracketed_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
