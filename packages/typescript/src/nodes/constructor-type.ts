import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstructorType, FormalParameters, TypeParameters } from '../types.js';


class ConstructorTypeBuilder extends Builder<ConstructorType> {
  private _parameters: Builder;
  private _type!: Builder;
  private _typeParameters?: Builder;

  constructor(parameters: Builder) {
    super();
    this._parameters = parameters;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  typeParameters(value: Builder): this {
    this._typeParameters = value;
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
      parameters: this.renderChild(this._parameters, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as ConstructorType;
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

export function constructor_type(parameters: Builder): ConstructorTypeBuilder {
  return new ConstructorTypeBuilder(parameters);
}

export interface ConstructorTypeOptions {
  parameters: Builder<FormalParameters>;
  type: Builder;
  typeParameters?: Builder<TypeParameters>;
}

export namespace constructor_type {
  export function from(options: ConstructorTypeOptions): ConstructorTypeBuilder {
    const b = new ConstructorTypeBuilder(options.parameters);
    if (options.type !== undefined) b.type(options.type);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
