import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractMethodSignature } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AbstractMethodSignatureBuilder extends BaseBuilder<AbstractMethodSignature> {
  private _name: Child;
  private _parameters!: Child;
  private _returnType?: Child;
  private _typeParameters?: Child;
  private _children: Child[] = [];

  constructor(name: Child) {
    super();
    this._name = name;
  }

  parameters(value: Child): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Child): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) {
      parts.push(this.renderChildren(this._children, ' ', ctx));
    }
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    parts.push('(' + (this._parameters ? this.renderChild(this._parameters, ctx) : '') + ')');
    if (this._returnType) parts.push('->', this.renderChild(this._returnType, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AbstractMethodSignature {
    return {
      kind: 'abstract_method_signature',
      name: this.renderChild(this._name, ctx),
      parameters: this._parameters ? this.renderChild(this._parameters, ctx) : undefined,
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AbstractMethodSignature;
  }

  override get nodeKind(): string { return 'abstract_method_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    return parts;
  }
}

export function abstract_method_signature(name: Child): AbstractMethodSignatureBuilder {
  return new AbstractMethodSignatureBuilder(name);
}
