import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_assertion', () => {
  it('should create a type_assertion node via builder', () => {
    const builder = ir.type_assertion([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('type_assertion');
  });

  it('should render without throwing', () => {
    const builder = ir.type_assertion([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
