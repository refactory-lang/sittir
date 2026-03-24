import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('shorthand_field_initializer', () => {
  it('should create a shorthand_field_initializer node via builder', () => {
    const builder = ir.shorthand_field_initializer([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('shorthand_field_initializer');
  });

  it('should render without throwing', () => {
    const builder = ir.shorthand_field_initializer([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
