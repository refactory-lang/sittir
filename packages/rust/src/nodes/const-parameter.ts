import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstParameter, Identifier, Literal, NegativeLiteral, Type } from '../types.js';


class ConstParameterBuilder extends Builder<ConstParameter> {
  private _name: Builder;
  private _type!: Builder;
  private _value?: Builder;

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  value(value: Builder): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('const');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstParameter {
    return {
      kind: 'const_parameter',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as ConstParameter;
  }

  override get nodeKind(): string { return 'const_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'const', type: 'const' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export type { ConstParameterBuilder };

export function const_parameter(name: Builder): ConstParameterBuilder {
  return new ConstParameterBuilder(name);
}

export interface ConstParameterOptions {
  name: Builder<Identifier> | string;
  type: Builder<Type>;
  value?: Builder<Literal | Identifier | NegativeLiteral>;
}

export namespace const_parameter {
  export function from(options: ConstParameterOptions): ConstParameterBuilder {
    const _ctor = options.name;
    const b = new ConstParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.type !== undefined) b.type(options.type);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
