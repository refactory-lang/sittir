import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('constructor_type', () => {
  it('should create a constructor_type node via builder', () => {
    const builder = ir.constructor_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('constructor_type');
  });

  it('should render without throwing', () => {
    const builder = ir.constructor_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
