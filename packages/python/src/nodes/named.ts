import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Identifier, NamedExpression } from '../types.js';


class NamedBuilder extends Builder<NamedExpression> {
  private _name: Builder<Identifier>;
  private _value!: Builder<Expression>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':=');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NamedExpression {
    return {
      kind: 'named_expression',
      name: this._name.build(ctx),
      value: this._value?.build(ctx),
    } as NamedExpression;
  }

  override get nodeKind(): string { return 'named_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':=', type: ':=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { NamedBuilder };

export function named(name: Builder<Identifier>): NamedBuilder {
  return new NamedBuilder(name);
}

export interface NamedExpressionOptions {
  name: Builder<Identifier> | string;
  value: Builder<Expression>;
}

export namespace named {
  export function from(options: NamedExpressionOptions): NamedBuilder {
    const _ctor = options.name;
    const b = new NamedBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
