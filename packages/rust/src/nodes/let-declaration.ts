import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, LetDeclaration, MutableSpecifier, Pattern, Type } from '../types.js';


class LetDeclarationBuilder extends Builder<LetDeclaration> {
  private _alternative?: Builder;
  private _pattern: Builder<Pattern>;
  private _type?: Builder<Type>;
  private _value?: Builder<Expression>;
  private _children: Builder<MutableSpecifier>[] = [];

  constructor(pattern: Builder<Pattern>) {
    super();
    this._pattern = pattern;
  }

  alternative(value: Builder): this {
    this._alternative = value;
    return this;
  }

  type(value: Builder<Type>): this {
    this._type = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<MutableSpecifier>[]): this {
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
      alternative: this._alternative?.build(ctx),
      pattern: this._pattern.build(ctx),
      type: this._type?.build(ctx),
      value: this._value?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as LetDeclaration;
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

export type { LetDeclarationBuilder };

export function let_declaration(pattern: Builder<Pattern>): LetDeclarationBuilder {
  return new LetDeclarationBuilder(pattern);
}

export interface LetDeclarationOptions {
  alternative?: Builder;
  pattern: Builder<Pattern>;
  type?: Builder<Type>;
  value?: Builder<Expression>;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace let_declaration {
  export function from(options: LetDeclarationOptions): LetDeclarationBuilder {
    const b = new LetDeclarationBuilder(options.pattern);
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
