import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('internal_module', () => {
  it('should create a internal_module node via builder', () => {
    const builder = ir.internal_module(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('internal_module');
  });

  it('should render without throwing', () => {
    const builder = ir.internal_module(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
