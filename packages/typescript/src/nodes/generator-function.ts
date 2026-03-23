import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GeneratorFunction } from '../types.js';


class GeneratorFunctionBuilder extends BaseBuilder<GeneratorFunction> {
  private _body: BaseBuilder;
  private _name?: BaseBuilder;
  private _parameters!: BaseBuilder;
  private _returnType?: BaseBuilder;
  private _typeParameters?: BaseBuilder;

  constructor(body: BaseBuilder) {
    super();
    this._body = body;
  }

  name(value: BaseBuilder): this {
    this._name = value;
    return this;
  }

  parameters(value: BaseBuilder): this {
    this._parameters = value;
    return this;
  }

  returnType(value: BaseBuilder): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: BaseBuilder): this {
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
      body: this.renderChild(this._body, ctx),
      name: this._name ? this.renderChild(this._name, ctx) : undefined,
      parameters: this._parameters ? this.renderChild(this._parameters, ctx) : undefined,
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

export function generator_function(body: BaseBuilder): GeneratorFunctionBuilder {
  return new GeneratorFunctionBuilder(body);
}
