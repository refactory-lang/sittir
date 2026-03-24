import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_parameter', () => {
  it('should create a type_parameter node via builder', () => {
    const builder = ir.type_parameter(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.type_parameter(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
