import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, LetChain, LetCondition } from '../types.js';
import { let_condition } from './let-condition.js';
import type { LetConditionOptions } from './let-condition.js';


class LetChainBuilder extends Builder<LetChain> {
  private _children: Builder<Expression | LetCondition>[] = [];

  constructor(...children: Builder<Expression | LetCondition>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LetChain {
    return {
      kind: 'let_chain',
      children: this._children.map(c => c.build(ctx)),
    } as LetChain;
  }

  override get nodeKind(): 'let_chain' { return 'let_chain'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LetChainBuilder };

export function let_chain(...children: Builder<Expression | LetCondition>[]): LetChainBuilder {
  return new LetChainBuilder(...children);
}

export interface LetChainOptions {
  nodeKind: 'let_chain';
  children?: Builder<Expression | LetCondition> | Omit<LetConditionOptions, 'nodeKind'> | (Builder<Expression | LetCondition> | Omit<LetConditionOptions, 'nodeKind'>)[];
}

export namespace let_chain {
  export function from(input: Omit<LetChainOptions, 'nodeKind'> | Builder<Expression | LetCondition> | Omit<LetConditionOptions, 'nodeKind'> | (Builder<Expression | LetCondition> | Omit<LetConditionOptions, 'nodeKind'>)[]): LetChainBuilder {
    const options: Omit<LetChainOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<LetChainOptions, 'nodeKind'>
      : { children: input } as Omit<LetChainOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new LetChainBuilder(..._arr.map(_v => _v instanceof Builder ? _v : let_condition.from(_v)));
    return b;
  }
}
