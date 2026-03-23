import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_parameters', () => {
  it('should create a type_parameters node via builder', () => {
    const builder = ir.type_parameters([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('type_parameters');
  });

  it('should render without throwing', () => {
    const builder = ir.type_parameters([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
