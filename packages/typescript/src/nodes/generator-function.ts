import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, FormalParameters, GeneratorFunction, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class GeneratorFunctionBuilder extends Builder<GeneratorFunction> {
  private _name?: Builder<Identifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters: Builder<FormalParameters>;
  private _returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  private _body!: Builder<StatementBlock>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  name(value: Builder<Identifier>): this {
    this._name = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  returnType(value: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  body(value: Builder<StatementBlock>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('function');
    parts.push('*');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GeneratorFunction {
    return {
      kind: 'generator_function',
      name: this._name?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      parameters: this._parameters.build(ctx),
      returnType: this._returnType?.build(ctx),
      body: this._body?.build(ctx),
    } as GeneratorFunction;
  }

  override get nodeKind(): string { return 'generator_function'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'function', type: 'function' });
    parts.push({ kind: 'token', text: '*', type: '*' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { GeneratorFunctionBuilder };

export function generator_function(parameters: Builder<FormalParameters>): GeneratorFunctionBuilder {
  return new GeneratorFunctionBuilder(parameters);
}

export interface GeneratorFunctionOptions {
  name?: Builder<Identifier> | string;
  typeParameters?: Builder<TypeParameters> | TypeParametersOptions;
  parameters: Builder<FormalParameters> | FormalParametersOptions;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  body: Builder<StatementBlock> | StatementBlockOptions;
}

export namespace generator_function {
  export function from(options: GeneratorFunctionOptions): GeneratorFunctionBuilder {
    const _ctor = options.parameters;
    const b = new GeneratorFunctionBuilder(_ctor instanceof Builder ? _ctor : formal_parameters.from(_ctor as FormalParametersOptions));
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v as TypeParametersOptions));
    }
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v as StatementBlockOptions));
    }
    return b;
  }
}
