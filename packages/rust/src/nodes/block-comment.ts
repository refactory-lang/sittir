import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BlockComment } from '../types.js';


class BlockCommentBuilder extends BaseBuilder<BlockComment> {
  private _doc?: BaseBuilder;
  private _inner?: BaseBuilder;
  private _outer?: BaseBuilder;

  constructor() { super(); }

  doc(value: BaseBuilder): this {
    this._doc = value;
    return this;
  }

  inner(value: BaseBuilder): this {
    this._inner = value;
    return this;
  }

  outer(value: BaseBuilder): this {
    this._outer = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('/*');
    if (this._outer) parts.push(this.renderChild(this._outer, ctx));
    if (this._doc) parts.push(this.renderChild(this._doc, ctx));
    parts.push('*/');
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
    parts.push({ kind: 'token', text: '/*', type: '/*' });
    if (this._outer) parts.push({ kind: 'builder', builder: this._outer, fieldName: 'outer' });
    if (this._doc) parts.push({ kind: 'builder', builder: this._doc, fieldName: 'doc' });
    parts.push({ kind: 'token', text: '*/', type: '*/' });
    return parts;
  }
}

export function block_comment(): BlockCommentBuilder {
  return new BlockCommentBuilder();
}
