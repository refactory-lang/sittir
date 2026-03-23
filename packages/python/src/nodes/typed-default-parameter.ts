import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Identifier, TypedDefaultParameter } from '../types.js';


class TypedDefaultParameterBuilder extends Builder<TypedDefaultParameter> {
  private _name: Builder<Identifier>;
  private _type!: Builder;
  private _value!: Builder<Expression>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push('=');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypedDefaultParameter {
    return {
      kind: 'typed_default_parameter',
      name: this._name.build(ctx),
      type: this._type?.build(ctx),
      value: this._value?.build(ctx),
    } as TypedDefaultParameter;
  }

  override get nodeKind(): string { return 'typed_default_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { TypedDefaultParameterBuilder };

export function typed_default_parameter(name: Builder<Identifier>): TypedDefaultParameterBuilder {
  return new TypedDefaultParameterBuilder(name);
}

export interface TypedDefaultParameterOptions {
  name: Builder<Identifier> | string;
  type: Builder;
  value: Builder<Expression>;
}

export namespace typed_default_parameter {
  export function from(options: TypedDefaultParameterOptions): TypedDefaultParameterBuilder {
    const _ctor = options.name;
    const b = new TypedDefaultParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.type !== undefined) b.type(options.type);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
