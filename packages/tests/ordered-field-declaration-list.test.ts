import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('ordered_field_declaration_list', () => {
  it('should create a ordered_field_declaration_list node via builder', () => {
    const builder = ir.ordered_field_declaration_list();
    const node = builder.build();
    expect(node.kind).toBe('ordered_field_declaration_list');
  });

  it('should render without throwing', () => {
    const builder = ir.ordered_field_declaration_list();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
