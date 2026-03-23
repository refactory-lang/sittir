import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassStaticBlock } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ClassStaticBlockBuilder extends BaseBuilder<ClassStaticBlock> {
  private _body: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('static');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassStaticBlock {
    return {
      kind: 'class_static_block',
      body: this.renderChild(this._body, ctx),
    } as unknown as ClassStaticBlock;
  }

  override get nodeKind(): string { return 'class_static_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'static', type: 'static' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function class_static_block(body: Child): ClassStaticBlockBuilder {
  return new ClassStaticBlockBuilder(body);
}
