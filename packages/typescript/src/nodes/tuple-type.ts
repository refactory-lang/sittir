import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptionalParameter, OptionalType, RequiredParameter, RestType, TupleType } from '../types.js';


class TupleTypeBuilder extends Builder<TupleType> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TupleType {
    return {
      kind: 'tuple_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TupleType;
  }

  override get nodeKind(): string { return 'tuple_type'; }

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

export type { TupleTypeBuilder };

export function tuple_type(): TupleTypeBuilder {
  return new TupleTypeBuilder();
}

export interface TupleTypeOptions {
  children?: Builder<OptionalParameter | OptionalType | RequiredParameter | RestType> | (Builder<OptionalParameter | OptionalType | RequiredParameter | RestType>)[];
}

export namespace tuple_type {
  export function from(options: TupleTypeOptions): TupleTypeBuilder {
    const b = new TupleTypeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
