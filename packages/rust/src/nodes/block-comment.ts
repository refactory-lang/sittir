import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BlockComment } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class BlockCommentBuilder extends BaseBuilder<BlockComment> {
  private _doc?: Child;
  private _inner?: Child;
  private _outer?: Child;

  constructor() { super(); }

  doc(value: Child): this {
    this._doc = value;
    return this;
  }

  inner(value: Child): this {
    this._inner = value;
    return this;
  }

  outer(value: Child): this {
    this._outer = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._doc) parts.push(this.renderChild(this._doc, ctx));
    if (this._inner) parts.push(this.renderChild(this._inner, ctx));
    if (this._outer) parts.push(this.renderChild(this._outer, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BlockComment {
    return {
      kind: 'block_comment',
      doc: this._doc ? this.renderChild(this._doc, ctx) : undefined,
      inner: this._inner ? this.renderChild(this._inner, ctx) : undefined,
      outer: this._outer ? this.renderChild(this._outer, ctx) : undefined,
    } as unknown as BlockComment;
  }

  override get nodeKind(): string { return 'block_comment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._doc) parts.push({ kind: 'builder', builder: this._doc, fieldName: 'doc' });
    if (this._inner) parts.push({ kind: 'builder', builder: this._inner, fieldName: 'inner' });
    if (this._outer) parts.push({ kind: 'builder', builder: this._outer, fieldName: 'outer' });
    return parts;
  }
}

export function block_comment(): BlockCommentBuilder {
  return new BlockCommentBuilder();
}
