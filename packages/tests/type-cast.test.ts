import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_cast_expression', () => {
  it('should create a type_cast_expression node via builder', () => {
    const builder = ir.type_cast(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_cast_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.type_cast(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
