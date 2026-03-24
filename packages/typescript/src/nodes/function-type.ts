import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Asserts, FormalParameters, FunctionType, Type, TypeParameters, TypePredicate } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';
import { asserts } from './asserts.js';
import type { AssertsOptions } from './asserts.js';
import { type_predicate } from './type-predicate.js';
import type { TypePredicateOptions } from './type-predicate.js';


class FunctionTypeBuilder extends Builder<FunctionType> {
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters: Builder<FormalParameters>;
  private _returnType!: Builder<Type | Asserts | TypePredicate>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  returnType(value: Builder<Type | Asserts | TypePredicate>): this {
    this._returnType = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    parts.push('=>');
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionType {
    return {
      kind: 'function_type',
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      parameters: this._parameters.build(ctx),
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
    } as FunctionType;
  }

  override get nodeKind(): 'function_type' { return 'function_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    return parts;
  }
}

export type { FunctionTypeBuilder };

export function function_type(parameters: Builder<FormalParameters>): FunctionTypeBuilder {
  return new FunctionTypeBuilder(parameters);
}

export interface FunctionTypeOptions {
  nodeKind: 'function_type';
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  parameters: Builder<FormalParameters> | Omit<FormalParametersOptions, 'nodeKind'>;
  returnType: Builder<Type | Asserts | TypePredicate> | AssertsOptions | TypePredicateOptions;
}

export namespace function_type {
  export function from(options: Omit<FunctionTypeOptions, 'nodeKind'>): FunctionTypeBuilder {
    const _ctor = options.parameters;
    const b = new FunctionTypeBuilder(_ctor instanceof Builder ? _ctor : formal_parameters.from(_ctor));
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.returnType !== undefined) {
      const _v = options.returnType;
      if (_v instanceof Builder) {
        b.returnType(_v);
      } else {
        switch (_v.nodeKind) {
          case 'asserts': b.returnType(asserts.from(_v)); break;
          case 'type_predicate': b.returnType(type_predicate.from(_v)); break;
        }
      }
    }
    return b;
  }
}
