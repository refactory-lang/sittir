import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_declaration', () => {
  it('should create a enum_declaration node via builder', () => {
    const builder = ir.enum(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('enum_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.enum(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
