import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_variant', () => {
  it('should create a enum_variant node via builder', () => {
    const builder = ir.enum_variant(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('enum_variant');
  });

  it('should render without throwing', () => {
    const builder = ir.enum_variant(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
