import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('field_declaration_list', () => {
  it('should create a field_declaration_list node via builder', () => {
    const builder = ir.field_declaration_list();
    const node = builder.build();
    expect(node.kind).toBe('field_declaration_list');
  });

  it('should render without throwing', () => {
    const builder = ir.field_declaration_list();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
