import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('public_field_definition', () => {
  it('should create a public_field_definition node via builder', () => {
    const builder = ir.public_field_definition(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('public_field_definition');
  });

  it('should render without throwing', () => {
    const builder = ir.public_field_definition(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
