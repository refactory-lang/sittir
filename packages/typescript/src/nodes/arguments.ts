import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, Expression, SpreadElement } from '../types.js';
import { spread_element } from './spread-element.js';
import type { SpreadElementOptions } from './spread-element.js';


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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Arguments {
    return {
      kind: 'arguments',
      children: this._children.map(c => c.build(ctx)),
    } as Arguments;
  }

  override get nodeKind(): 'arguments' { return 'arguments'; }

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
  nodeKind: 'arguments';
  children?: Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'> | (Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'>)[];
}

export namespace arguments_ {
  export function from(input: Omit<ArgumentsOptions, 'nodeKind'> | Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'> | (Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'>)[]): ArgumentsBuilder {
    const options: Omit<ArgumentsOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ArgumentsOptions, 'nodeKind'>
      : { children: input } as Omit<ArgumentsOptions, 'nodeKind'>;
    const b = new ArgumentsBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : spread_element.from(_x)));
    }
    return b;
  }
}
