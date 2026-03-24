import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Array, Expression, SpreadElement } from '../types.js';
import { spread_element } from './spread-element.js';
import type { SpreadElementOptions } from './spread-element.js';


class ArrayBuilder extends Builder<Array> {
  private _children: Builder<Expression | SpreadElement>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | SpreadElement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Array {
    return {
      kind: 'array',
      children: this._children.map(c => c.build(ctx)),
    } as Array;
  }

  override get nodeKind(): 'array' { return 'array'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ArrayBuilder };

export function array(): ArrayBuilder {
  return new ArrayBuilder();
}

export interface ArrayOptions {
  nodeKind: 'array';
  children?: Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'> | (Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'>)[];
}

export namespace array {
  export function from(input: Omit<ArrayOptions, 'nodeKind'> | Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'> | (Builder<Expression | SpreadElement> | Omit<SpreadElementOptions, 'nodeKind'>)[]): ArrayBuilder {
    const options: Omit<ArrayOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ArrayOptions, 'nodeKind'>
      : { children: input } as Omit<ArrayOptions, 'nodeKind'>;
    const b = new ArrayBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : spread_element.from(_x)));
    }
    return b;
  }
}
