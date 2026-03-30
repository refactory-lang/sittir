import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_body', () => {
  it('should create a enum_body node via builder', () => {
    const builder = ir.enum_body();
    const node = builder.build();
    expect(node.kind).toBe('enum_body');
  });

  it('should render without throwing', () => {
    const builder = ir.enum_body();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
