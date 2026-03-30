import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('mod_item', () => {
  it('should create a mod_item node via builder', () => {
    const builder = ir.mod(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('mod_item');
  });

  it('should render without throwing', () => {
    const builder = ir.mod(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
