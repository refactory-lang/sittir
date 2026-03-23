import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, AttributeItem, Expression } from '../types.js';


class ArgumentsBuilder extends Builder<Arguments> {
  private _children: Builder<Expression | AttributeItem>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | AttributeItem>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Arguments {
    return {
      kind: 'arguments',
      children: this._children.map(c => c.build(ctx)),
    } as Arguments;
  }

  override get nodeKind(): string { return 'arguments'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ArgumentsBuilder };

export function arguments_(): ArgumentsBuilder {
  return new ArgumentsBuilder();
}

export interface ArgumentsOptions {
  children?: Builder<Expression | AttributeItem> | (Builder<Expression | AttributeItem>)[];
}

export namespace arguments_ {
  export function from(options: ArgumentsOptions): ArgumentsBuilder {
    const b = new ArgumentsBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
