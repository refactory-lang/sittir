import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TupleType, Type } from '../types.js';


class TupleTypeBuilder extends Builder<TupleType> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    parts.push(')');
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
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { TupleTypeBuilder };

export function tuple_type(...children: Builder[]): TupleTypeBuilder {
  return new TupleTypeBuilder(...children);
}

export interface TupleTypeOptions {
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace tuple_type {
  export function from(options: TupleTypeOptions): TupleTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TupleTypeBuilder(..._arr);
    return b;
  }
}
