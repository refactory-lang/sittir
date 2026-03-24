import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('class_body', () => {
  it('should create a class_body node via builder', () => {
    const builder = ir.class_body();
    const node = builder.build();
    expect(node.kind).toBe('class_body');
  });

  it('should render without throwing', () => {
    const builder = ir.class_body();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
