import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BlockComment, DocComment, InnerDocCommentMarker, OuterDocCommentMarker } from '../types.js';


class BlockCommentBuilder extends Builder<BlockComment> {
  private _doc?: Builder;
  private _inner?: Builder;
  private _outer?: Builder;

  constructor() { super(); }

  doc(value: Builder): this {
    this._doc = value;
    return this;
  }

  inner(value: Builder): this {
    this._inner = value;
    return this;
  }

  outer(value: Builder): this {
    this._outer = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('/*');
    if (this._outer) parts.push(this.renderChild(this._outer, ctx));
    if (this._doc) parts.push(this.renderChild(this._doc, ctx));
    parts.push('*/');
    if (this._inner) parts.push(this.renderChild(this._inner, ctx));
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
    if (this._inner) parts.push({ kind: 'builder', builder: this._inner, fieldName: 'inner' });
    return parts;
  }
}

export type { BlockCommentBuilder };

export function block_comment(): BlockCommentBuilder {
  return new BlockCommentBuilder();
}

export interface BlockCommentOptions {
  doc?: Builder<DocComment> | string;
  inner?: Builder<InnerDocCommentMarker> | string;
  outer?: Builder<OuterDocCommentMarker> | string;
}

export namespace block_comment {
  export function from(options: BlockCommentOptions): BlockCommentBuilder {
    const b = new BlockCommentBuilder();
    if (options.doc !== undefined) {
      const _v = options.doc;
      b.doc(typeof _v === 'string' ? new LeafBuilder('doc_comment', _v) : _v);
    }
    if (options.inner !== undefined) {
      const _v = options.inner;
      b.inner(typeof _v === 'string' ? new LeafBuilder('inner_doc_comment_marker', _v) : _v);
    }
    if (options.outer !== undefined) {
      const _v = options.outer;
      b.outer(typeof _v === 'string' ? new LeafBuilder('outer_doc_comment_marker', _v) : _v);
    }
    return b;
  }
}
