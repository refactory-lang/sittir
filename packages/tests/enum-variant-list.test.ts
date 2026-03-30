import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_variant_list', () => {
  it('should create a enum_variant_list node via builder', () => {
    const builder = ir.enum_variant_list();
    const node = builder.build();
    expect(node.kind).toBe('enum_variant_list');
  });

  it('should render without throwing', () => {
    const builder = ir.enum_variant_list();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
