import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DefaultParameter, Expression, Identifier, TuplePattern } from '../types.js';


class DefaultParameterBuilder extends Builder<DefaultParameter> {
  private _name: Builder<Identifier | TuplePattern>;
  private _value!: Builder<Expression>;

  constructor(name: Builder<Identifier | TuplePattern>) {
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
    parts.push('=');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DefaultParameter {
    return {
      kind: 'default_parameter',
      name: this._name.build(ctx),
      value: this._value?.build(ctx),
    } as DefaultParameter;
  }

  override get nodeKind(): string { return 'default_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { DefaultParameterBuilder };

export function default_parameter(name: Builder<Identifier | TuplePattern>): DefaultParameterBuilder {
  return new DefaultParameterBuilder(name);
}

export interface DefaultParameterOptions {
  name: Builder<Identifier | TuplePattern>;
  value: Builder<Expression>;
}

export namespace default_parameter {
  export function from(options: DefaultParameterOptions): DefaultParameterBuilder {
    const b = new DefaultParameterBuilder(options.name);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
