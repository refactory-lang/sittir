import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('switch_body', () => {
  it('should create a switch_body node via builder', () => {
    const builder = ir.switch_body();
    const node = builder.build();
    expect(node.kind).toBe('switch_body');
  });

  it('should render without throwing', () => {
    const builder = ir.switch_body();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
