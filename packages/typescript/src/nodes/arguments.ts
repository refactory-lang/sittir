import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ArgumentsBuilder extends BaseBuilder<Arguments> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Arguments {
    return {
      kind: 'arguments',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Arguments;
  }

  override get nodeKind(): string { return 'arguments'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function arguments_(): ArgumentsBuilder {
  return new ArgumentsBuilder();
}
