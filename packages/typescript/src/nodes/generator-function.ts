import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, FormalParameters, GeneratorFunction, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';


class GeneratorFunctionBuilder extends Builder<GeneratorFunction> {
  private _body!: Builder;
  private _name?: Builder;
  private _parameters: Builder;
  private _returnType?: Builder;
  private _typeParameters?: Builder;

  constructor(parameters: Builder) {
    super();
    this._parameters = parameters;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  name(value: Builder): this {
    this._name = value;
    return this;
  }

  returnType(value: Builder): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder): this {
    this._typeParameters = value;
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this._name ? this.renderChild(this._name, ctx) : undefined,
      parameters: this.renderChild(this._parameters, ctx),
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as GeneratorFunction;
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

export function generator_function(parameters: Builder): GeneratorFunctionBuilder {
  return new GeneratorFunctionBuilder(parameters);
}

export interface GeneratorFunctionOptions {
  body: Builder<StatementBlock>;
  name?: Builder<Identifier> | string;
  parameters: Builder<FormalParameters>;
  returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  typeParameters?: Builder<TypeParameters>;
}

export namespace generator_function {
  export function from(options: GeneratorFunctionOptions): GeneratorFunctionBuilder {
    const b = new GeneratorFunctionBuilder(options.parameters);
    if (options.body !== undefined) b.body(options.body);
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
