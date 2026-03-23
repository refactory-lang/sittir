import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericType, Identifier, Pattern, ScopedIdentifier, TupleStructPattern } from '../types.js';


class TupleStructPatternBuilder extends Builder<TupleStructPattern> {
  private _type: Builder<GenericType | Identifier | ScopedIdentifier>;
  private _children: Builder<Pattern>[] = [];

  constructor(type_: Builder<GenericType | Identifier | ScopedIdentifier>) {
    super();
    this._type = type_;
  }

  children(...value: Builder<Pattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
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

  build(ctx?: RenderContext): TupleStructPattern {
    return {
      kind: 'tuple_struct_pattern',
      type: this._type.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as TupleStructPattern;
  }

  override get nodeKind(): string { return 'tuple_struct_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { TupleStructPatternBuilder };

export function tuple_struct_pattern(type_: Builder<GenericType | Identifier | ScopedIdentifier>): TupleStructPatternBuilder {
  return new TupleStructPatternBuilder(type_);
}

export interface TupleStructPatternOptions {
  type: Builder<GenericType | Identifier | ScopedIdentifier>;
  children?: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace tuple_struct_pattern {
  export function from(options: TupleStructPatternOptions): TupleStructPatternBuilder {
    const b = new TupleStructPatternBuilder(options.type);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
