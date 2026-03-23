import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generic_type_with_turbofish', () => {
  it('should create a generic_type_with_turbofish node via builder', () => {
    const builder = ir.generic_type_with_turbofish(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('generic_type_with_turbofish');
  });

  it('should render without throwing', () => {
    const builder = ir.generic_type_with_turbofish(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
