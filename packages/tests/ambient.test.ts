import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('ambient_declaration', () => {
  it('should create a ambient_declaration node via builder', () => {
    const builder = ir.ambient([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('ambient_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.ambient([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
