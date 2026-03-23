import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FunctionType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FunctionTypeBuilder extends BaseBuilder<FunctionType> {
  private _parameters: Child;
  private _returnType?: Child;
  private _trait?: Child;
  private _children: Child[] = [];

  constructor(parameters: Child) {
    super();
    this._parameters = parameters;
  }

  returnType(value: Child): this {
    this._returnType = value;
    return this;
  }

  trait(value: Child): this {
    this._trait = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('function');
    if (this._trait) parts.push(this.renderChild(this._trait, ctx), 'for');
    parts.push('(' + (this._parameters ? this.renderChild(this._parameters, ctx) : '') + ')');
    if (this._returnType) parts.push('->', this.renderChild(this._returnType, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionType {
    return {
      kind: 'function_type',
      parameters: this.renderChild(this._parameters, ctx),
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      trait: this._trait ? this.renderChild(this._trait, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FunctionType;
  }

  override get nodeKind(): string { return 'function_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'function' });
    if (this._trait) {
      parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
      parts.push({ kind: 'token', text: 'for' });
    }
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function function_type(parameters: Child): FunctionTypeBuilder {
  return new FunctionTypeBuilder(parameters);
}
