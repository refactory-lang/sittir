import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, OptionalTupleParameter, TypeAnnotation } from '../types.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class OptionalTupleParameterBuilder extends Builder<OptionalTupleParameter> {
  private _name: Builder<Identifier>;
  private _type!: Builder<TypeAnnotation>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('?');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OptionalTupleParameter {
    return {
      kind: 'optional_tuple_parameter',
      name: this._name.build(ctx),
      type: this._type?.build(ctx),
    } as OptionalTupleParameter;
  }

  override get nodeKind(): string { return 'optional_tuple_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: '?', type: '?' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { OptionalTupleParameterBuilder };

export function optional_tuple_parameter(name: Builder<Identifier>): OptionalTupleParameterBuilder {
  return new OptionalTupleParameterBuilder(name);
}

export interface OptionalTupleParameterOptions {
  name: Builder<Identifier> | string;
  type: Builder<TypeAnnotation> | TypeAnnotationOptions;
}

export namespace optional_tuple_parameter {
  export function from(options: OptionalTupleParameterOptions): OptionalTupleParameterBuilder {
    const _ctor = options.name;
    const b = new OptionalTupleParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v as TypeAnnotationOptions));
    }
    return b;
  }
}
