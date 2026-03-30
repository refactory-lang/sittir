import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_alias_declaration', () => {
  it('should create a type_alias_declaration node via builder', () => {
    const builder = ir.type_alias(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_alias_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.type_alias(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
