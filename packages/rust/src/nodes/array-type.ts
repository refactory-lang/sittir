import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayType, Expression, Type } from '../types.js';


class ArrayTypeBuilder extends Builder<ArrayType> {
  private _element: Builder<Type>;
  private _length?: Builder<Expression>;

  constructor(element: Builder<Type>) {
    super();
    this._element = element;
  }

  length(value: Builder<Expression>): this {
    this._length = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._element) parts.push(this.renderChild(this._element, ctx));
    if (this._length) {
      parts.push(';');
      if (this._length) parts.push(this.renderChild(this._length, ctx));
    }
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayType {
    return {
      kind: 'array_type',
      element: this._element.build(ctx),
      length: this._length?.build(ctx),
    } as ArrayType;
  }

  override get nodeKind(): string { return 'array_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    if (this._element) parts.push({ kind: 'builder', builder: this._element, fieldName: 'element' });
    if (this._length) {
      parts.push({ kind: 'token', text: ';', type: ';' });
      if (this._length) parts.push({ kind: 'builder', builder: this._length, fieldName: 'length' });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ArrayTypeBuilder };

export function array_type(element: Builder<Type>): ArrayTypeBuilder {
  return new ArrayTypeBuilder(element);
}

export interface ArrayTypeOptions {
  element: Builder<Type>;
  length?: Builder<Expression>;
}

export namespace array_type {
  export function from(options: ArrayTypeOptions): ArrayTypeBuilder {
    const b = new ArrayTypeBuilder(options.element);
    if (options.length !== undefined) b.length(options.length);
    return b;
  }
}
