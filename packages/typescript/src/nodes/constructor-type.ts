import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstructorType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ConstructorTypeBuilder extends BaseBuilder<ConstructorType> {
  private _parameters: Child;
  private _type!: Child;
  private _typeParameters?: Child;

  constructor(parameters: Child) {
    super();
    this._parameters = parameters;
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('constructor');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    parts.push('(' + (this._parameters ? this.renderChild(this._parameters, ctx) : '') + ')');
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
    parts.push({ kind: 'token', text: 'constructor' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function constructor_type(parameters: Child): ConstructorTypeBuilder {
  return new ConstructorTypeBuilder(parameters);
}
