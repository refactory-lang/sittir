import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstBlock } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ConstBlockBuilder extends BaseBuilder<ConstBlock> {
  private _body: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstBlock {
    return {
      kind: 'const_block',
      body: this.renderChild(this._body, ctx),
    } as unknown as ConstBlock;
  }

  override get nodeKind(): string { return 'const_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function const_block(body: Child): ConstBlockBuilder {
  return new ConstBlockBuilder(body);
}
