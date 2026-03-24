import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, FunctionDefinition, Identifier, Parameters, Type, TypeParameter } from '../types.js';
import { type_parameter } from './type-parameter.js';
import type { TypeParameterOptions } from './type-parameter.js';
import { parameters } from './parameters.js';
import type { ParametersOptions } from './parameters.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class FunctionDefinitionBuilder extends Builder<FunctionDefinition> {
  private _name: Builder<Identifier>;
  private _typeParameters?: Builder<TypeParameter>;
  private _parameters!: Builder<Parameters>;
  private _returnType?: Builder<Type>;
  private _body!: Builder<Block>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameter>): this {
    this._typeParameters = value;
    return this;
  }

  parameters(value: Builder<Parameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder<Type>): this {
    this._returnType = value;
    return this;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('def');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionDefinition {
    return {
      kind: 'function_definition',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      parameters: this._parameters ? this._parameters.build(ctx) : undefined,
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
    } as FunctionDefinition;
  }

  override get nodeKind(): 'function_definition' { return 'function_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'def', type: 'def' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { FunctionDefinitionBuilder };

export function function_definition(name: Builder<Identifier>): FunctionDefinitionBuilder {
  return new FunctionDefinitionBuilder(name);
}

export interface FunctionDefinitionOptions {
  nodeKind: 'function_definition';
  name: Builder<Identifier> | string;
  typeParameters?: Builder<TypeParameter> | Omit<TypeParameterOptions, 'nodeKind'>;
  parameters: Builder<Parameters> | Omit<ParametersOptions, 'nodeKind'>;
  returnType?: Builder<Type> | Omit<TypeOptions, 'nodeKind'>;
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
}

export namespace function_definition {
  export function from(options: Omit<FunctionDefinitionOptions, 'nodeKind'>): FunctionDefinitionBuilder {
    const _ctor = options.name;
    const b = new FunctionDefinitionBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameter.from(_v));
    }
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : parameters.from(_v));
    }
    if (options.returnType !== undefined) {
      const _v = options.returnType;
      b.returnType(_v instanceof Builder ? _v : type_.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : block.from(_v));
    }
    return b;
  }
}
