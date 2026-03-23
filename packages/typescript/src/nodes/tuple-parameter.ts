import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, RestPattern, TupleParameter, TypeAnnotation } from '../types.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class TupleParameterBuilder extends Builder<TupleParameter> {
  private _name: Builder<Identifier | RestPattern>;
  private _type!: Builder<TypeAnnotation>;

  constructor(name: Builder<Identifier | RestPattern>) {
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
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TupleParameter {
    return {
      kind: 'tuple_parameter',
      name: this._name.build(ctx),
      type: this._type?.build(ctx),
    } as TupleParameter;
  }

  override get nodeKind(): string { return 'tuple_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TupleParameterBuilder };

export function tuple_parameter(name: Builder<Identifier | RestPattern>): TupleParameterBuilder {
  return new TupleParameterBuilder(name);
}

export interface TupleParameterOptions {
  name: Builder<Identifier | RestPattern> | string;
  type: Builder<TypeAnnotation> | TypeAnnotationOptions;
}

export namespace tuple_parameter {
  export function from(options: TupleParameterOptions): TupleParameterBuilder {
    const _ctor = options.name;
    const b = new TupleParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v as TypeAnnotationOptions));
    }
    return b;
  }
}
