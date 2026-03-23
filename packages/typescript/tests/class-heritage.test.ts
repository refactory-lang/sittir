import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('class_heritage', () => {
  it('should create a class_heritage node via builder', () => {
    const builder = ir.class_heritage([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('class_heritage');
  });

  it('should render without throwing', () => {
    const builder = ir.class_heritage([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
