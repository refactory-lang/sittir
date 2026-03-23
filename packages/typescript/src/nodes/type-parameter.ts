import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Constraint, DefaultType, TypeIdentifier, TypeParameter } from '../types.js';


class TypeParameterBuilder extends Builder<TypeParameter> {
  private _constraint?: Builder;
  private _name: Builder;
  private _value?: Builder;

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  constraint(value: Builder): this {
    this._constraint = value;
    return this;
  }

  value(value: Builder): this {
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
      constraint: this._constraint ? this.renderChild(this._constraint, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as TypeParameter;
  }

  override get nodeKind(): string { return 'type_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._constraint) parts.push({ kind: 'builder', builder: this._constraint, fieldName: 'constraint' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { TypeParameterBuilder };

export function type_parameter(name: Builder): TypeParameterBuilder {
  return new TypeParameterBuilder(name);
}

export interface TypeParameterOptions {
  constraint?: Builder<Constraint>;
  name: Builder<TypeIdentifier> | string;
  value?: Builder<DefaultType>;
}

export namespace type_parameter {
  export function from(options: TypeParameterOptions): TypeParameterBuilder {
    const _ctor = options.name;
    const b = new TypeParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.constraint !== undefined) b.constraint(options.constraint);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
