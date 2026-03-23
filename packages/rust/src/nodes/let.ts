import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, LetDeclaration, MutableSpecifier, Pattern, Type } from '../types.js';


class LetBuilder extends Builder<LetDeclaration> {
  private _alternative?: Builder;
  private _pattern: Builder;
  private _type?: Builder;
  private _value?: Builder;
  private _children: Builder[] = [];

  constructor(pattern: Builder) {
    super();
    this._pattern = pattern;
  }

  alternative(value: Builder): this {
    this._alternative = value;
    return this;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  value(value: Builder): this {
    this._value = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('let');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    if (this._type) {
      parts.push(':');
      if (this._type) parts.push(this.renderChild(this._type, ctx));
    }
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    if (this._alternative) {
      parts.push('else');
      if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    }
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LetDeclaration {
    return {
      kind: 'let_declaration',
      alternative: this._alternative ? this.renderChild(this._alternative, ctx) : undefined,
      pattern: this.renderChild(this._pattern, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as LetDeclaration;
  }

  override get nodeKind(): string { return 'let_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'let', type: 'let' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    if (this._type) {
      parts.push({ kind: 'token', text: ':', type: ':' });
      if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    }
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    if (this._alternative) {
      parts.push({ kind: 'token', text: 'else', type: 'else' });
      if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { LetBuilder };

export function let_(pattern: Builder): LetBuilder {
  return new LetBuilder(pattern);
}

export interface LetDeclarationOptions {
  alternative?: Builder;
  pattern: Builder<Pattern>;
  type?: Builder<Type>;
  value?: Builder<Expression>;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace let_ {
  export function from(options: LetDeclarationOptions): LetBuilder {
    const b = new LetBuilder(options.pattern);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.type !== undefined) b.type(options.type);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x));
    }
    return b;
  }
}
