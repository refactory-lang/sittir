import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, Expression, SpreadElement } from '../types.js';


class ArgumentsBuilder extends Builder<Arguments> {
  private _children: Builder<Expression | SpreadElement>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | SpreadElement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
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
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
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
  children?: Builder<Expression | SpreadElement> | (Builder<Expression | SpreadElement>)[];
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
