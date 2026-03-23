import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FunctionModifiers } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FunctionModifiersBuilder extends BaseBuilder<FunctionModifiers> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('async');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionModifiers {
    return {
      kind: 'function_modifiers',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FunctionModifiers;
  }

  override get nodeKind(): string { return 'function_modifiers'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'async', type: 'async' });
    return parts;
  }
}

export function function_modifiers(): FunctionModifiersBuilder {
  return new FunctionModifiersBuilder();
}
