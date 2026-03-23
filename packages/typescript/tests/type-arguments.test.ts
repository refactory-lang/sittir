import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_arguments', () => {
  it('should create a type_arguments node via builder', () => {
    const builder = ir.type_arguments([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('type_arguments');
  });

  it('should render without throwing', () => {
    const builder = ir.type_arguments([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
