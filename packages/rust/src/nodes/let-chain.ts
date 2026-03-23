import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, LetChain, LetCondition } from '../types.js';


class LetChainBuilder extends Builder<LetChain> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    return this._children ? this.renderChildren(this._children, ' ', ctx) : '';
  }

  build(ctx?: RenderContext): LetChain {
    return {
      kind: 'let_chain',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as LetChain;
  }

  override get nodeKind(): string { return 'let_chain'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LetChainBuilder };

export function let_chain(...children: Builder[]): LetChainBuilder {
  return new LetChainBuilder(...children);
}

export interface LetChainOptions {
  children: Builder<Expression | LetCondition> | (Builder<Expression | LetCondition>)[];
}

export namespace let_chain {
  export function from(options: LetChainOptions): LetChainBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new LetChainBuilder(..._arr);
    return b;
  }
}
