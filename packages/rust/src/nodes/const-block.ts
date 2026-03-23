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
    parts.push('const');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
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
    parts.push({ kind: 'token', text: 'const', type: 'const' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function const_block(body: Child): ConstBlockBuilder {
  return new ConstBlockBuilder(body);
}
