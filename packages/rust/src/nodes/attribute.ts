import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, Crate, Expression, Identifier, Metavariable, ScopedIdentifier, Self, Super, TokenTree } from '../types.js';


class AttributeBuilder extends Builder<Attribute> {
  private _arguments?: Builder;
  private _value?: Builder;
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  arguments(value: Builder): this {
    this._arguments = value;
    return this;
  }

  value(value: Builder): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Attribute {
    return {
      kind: 'attribute',
      arguments: this._arguments ? this.renderChild(this._arguments, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Attribute;
  }

  override get nodeKind(): string { return 'attribute'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    return parts;
  }
}

export type { AttributeBuilder };

export function attribute(children: Builder): AttributeBuilder {
  return new AttributeBuilder(children);
}

export interface AttributeOptions {
  arguments?: Builder<TokenTree>;
  value?: Builder<Expression>;
  children: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super> | (Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>)[];
}

export namespace attribute {
  export function from(options: AttributeOptions): AttributeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AttributeBuilder(_ctor);
    if (options.arguments !== undefined) b.arguments(options.arguments);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
