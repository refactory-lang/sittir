import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { False, LiteralType, Null, Number, String, True, UnaryExpression, Undefined } from '../types.js';


class LiteralTypeBuilder extends Builder<LiteralType> {
  private _operator?: Builder;
  private _argument?: Builder<Number>;
  private _children: Builder<UnaryExpression | Number | String | True | False | Null | Undefined>[] = [];

  constructor(...children: Builder<UnaryExpression | Number | String | True | False | Null | Undefined>[]) {
    super();
    this._children = children;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  argument(value: Builder<Number>): this {
    this._argument = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LiteralType {
    return {
      kind: 'literal_type',
      operator: this._operator?.build(ctx),
      argument: this._argument?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as LiteralType;
  }

  override get nodeKind(): string { return 'literal_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LiteralTypeBuilder };

export function literal_type(...children: Builder<UnaryExpression | Number | String | True | False | Null | Undefined>[]): LiteralTypeBuilder {
  return new LiteralTypeBuilder(...children);
}

export interface LiteralTypeOptions {
  operator?: Builder;
  argument?: Builder<Number> | string;
  children?: Builder<UnaryExpression | Number | String | True | False | Null | Undefined> | (Builder<UnaryExpression | Number | String | True | False | Null | Undefined>)[];
}

export namespace literal_type {
  export function from(options: LiteralTypeOptions): LiteralTypeBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new LiteralTypeBuilder(..._arr);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.argument !== undefined) {
      const _v = options.argument;
      b.argument(typeof _v === 'string' ? new LeafBuilder('number', _v) : _v);
    }
    return b;
  }
}
