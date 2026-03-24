import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Constraint, DefaultType, TypeIdentifier, TypeParameter } from '../types.js';
import { constraint } from './constraint.js';
import type { ConstraintOptions } from './constraint.js';
import { default_type } from './default-type.js';
import type { DefaultTypeOptions } from './default-type.js';


class TypeParameterBuilder extends Builder<TypeParameter> {
  private _name: Builder<TypeIdentifier>;
  private _constraint?: Builder<Constraint>;
  private _value?: Builder<DefaultType>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  constraint(value: Builder<Constraint>): this {
    this._constraint = value;
    return this;
  }

  value(value: Builder<DefaultType>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._constraint) parts.push(this.renderChild(this._constraint, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameter {
    return {
      kind: 'type_parameter',
      name: this._name.build(ctx),
      constraint: this._constraint ? this._constraint.build(ctx) : undefined,
      value: this._value ? this._value.build(ctx) : undefined,
    } as TypeParameter;
  }

  override get nodeKind(): 'type_parameter' { return 'type_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._constraint) parts.push({ kind: 'builder', builder: this._constraint, fieldName: 'constraint' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { TypeParameterBuilder };

export function type_parameter(name: Builder<TypeIdentifier>): TypeParameterBuilder {
  return new TypeParameterBuilder(name);
}

export interface TypeParameterOptions {
  nodeKind: 'type_parameter';
  name: Builder<TypeIdentifier> | string;
  constraint?: Builder<Constraint> | Omit<ConstraintOptions, 'nodeKind'>;
  value?: Builder<DefaultType> | Omit<DefaultTypeOptions, 'nodeKind'>;
}

export namespace type_parameter {
  export function from(options: Omit<TypeParameterOptions, 'nodeKind'>): TypeParameterBuilder {
    const _ctor = options.name;
    const b = new TypeParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.constraint !== undefined) {
      const _v = options.constraint;
      b.constraint(_v instanceof Builder ? _v : constraint.from(_v));
    }
    if (options.value !== undefined) {
      const _v = options.value;
      b.value(_v instanceof Builder ? _v : default_type.from(_v));
    }
    return b;
  }
}
