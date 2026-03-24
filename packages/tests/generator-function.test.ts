import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generator_function', () => {
  it('should create a generator_function node via builder', () => {
    const builder = ir.generatorFunction(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('generator_function');
  });

  it('should render without throwing', () => {
    const builder = ir.generatorFunction(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
