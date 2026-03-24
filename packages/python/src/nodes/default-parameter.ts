import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DefaultParameter, Expression, Identifier, TuplePattern } from '../types.js';
import { tuple_pattern } from './tuple-pattern.js';
import type { TuplePatternOptions } from './tuple-pattern.js';


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
      value: this._value ? this._value.build(ctx) : undefined,
    } as DefaultParameter;
  }

  override get nodeKind(): 'default_parameter' { return 'default_parameter'; }

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
  nodeKind: 'default_parameter';
  name: Builder<Identifier | TuplePattern> | string | Omit<TuplePatternOptions, 'nodeKind'>;
  value: Builder<Expression>;
}

export namespace default_parameter {
  export function from(options: Omit<DefaultParameterOptions, 'nodeKind'>): DefaultParameterBuilder {
    const _ctor = options.name;
    const b = new DefaultParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor instanceof Builder ? _ctor : tuple_pattern.from(_ctor));
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
