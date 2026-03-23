import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ArrayTypeBuilder extends BaseBuilder<ArrayType> {
  private _element: Child;
  private _length?: Child;

  constructor(element: Child) {
    super();
    this._element = element;
  }

  length(value: Child): this {
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
      element: this.renderChild(this._element, ctx),
      length: this._length ? this.renderChild(this._length, ctx) : undefined,
    } as unknown as ArrayType;
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

export function array_type(element: Child): ArrayTypeBuilder {
  return new ArrayTypeBuilder(element);
}
