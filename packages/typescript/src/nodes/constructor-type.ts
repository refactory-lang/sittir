import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstructorType, FormalParameters, Type, TypeParameters } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';


class ConstructorTypeBuilder extends Builder<ConstructorType> {
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters: Builder<FormalParameters>;
  private _type!: Builder<Type>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  type(value: Builder<Type>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('new');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    parts.push('=>');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstructorType {
    return {
      kind: 'constructor_type',
      typeParameters: this._typeParameters?.build(ctx),
      parameters: this._parameters.build(ctx),
      type: this._type?.build(ctx),
    } as ConstructorType;
  }

  override get nodeKind(): string { return 'constructor_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'new', type: 'new' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { ConstructorTypeBuilder };

export function constructor_type(parameters: Builder<FormalParameters>): ConstructorTypeBuilder {
  return new ConstructorTypeBuilder(parameters);
}

export interface ConstructorTypeOptions {
  typeParameters?: Builder<TypeParameters> | TypeParametersOptions;
  parameters: Builder<FormalParameters> | FormalParametersOptions;
  type: Builder<Type>;
}

export namespace constructor_type {
  export function from(options: ConstructorTypeOptions): ConstructorTypeBuilder {
    const _ctor = options.parameters;
    const b = new ConstructorTypeBuilder(_ctor instanceof Builder ? _ctor : formal_parameters.from(_ctor as FormalParametersOptions));
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v as TypeParametersOptions));
    }
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
