import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LetDeclaration } from '../types.js';


class LetBuilder extends BaseBuilder<LetDeclaration> {
  private _alternative?: BaseBuilder;
  private _pattern: BaseBuilder;
  private _type?: BaseBuilder;
  private _value?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(pattern: BaseBuilder) {
    super();
    this._pattern = pattern;
  }

  alternative(value: BaseBuilder): this {
    this._alternative = value;
    return this;
  }

  type(value: BaseBuilder): this {
    this._type = value;
    return this;
  }

  value(value: BaseBuilder): this {
    this._value = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
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

export function let_(pattern: BaseBuilder): LetBuilder {
  return new LetBuilder(pattern);
}
