import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('extends_type_clause', () => {
  it('should create a extends_type_clause node via builder', () => {
    const builder = ir.extends_type_clause([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('extends_type_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.extends_type_clause([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
