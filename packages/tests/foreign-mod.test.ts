import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('foreign_mod_item', () => {
  it('should create a foreign_mod_item node via builder', () => {
    const builder = ir.foreign_mod([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('foreign_mod_item');
  });

  it('should render without throwing', () => {
    const builder = ir.foreign_mod([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
