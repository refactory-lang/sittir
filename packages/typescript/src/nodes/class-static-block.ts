import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassStaticBlock, StatementBlock } from '../types.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class ClassStaticBlockBuilder extends Builder<ClassStaticBlock> {
  private _body: Builder<StatementBlock>;

  constructor(body: Builder<StatementBlock>) {
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
      body: this._body.build(ctx),
    } as ClassStaticBlock;
  }

  override get nodeKind(): string { return 'class_static_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'static', type: 'static' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ClassStaticBlockBuilder };

export function class_static_block(body: Builder<StatementBlock>): ClassStaticBlockBuilder {
  return new ClassStaticBlockBuilder(body);
}

export interface ClassStaticBlockOptions {
  body: Builder<StatementBlock> | StatementBlockOptions;
}

export namespace class_static_block {
  export function from(options: ClassStaticBlockOptions): ClassStaticBlockBuilder {
    const _ctor = options.body;
    const b = new ClassStaticBlockBuilder(_ctor instanceof Builder ? _ctor : statement_block.from(_ctor as StatementBlockOptions));
    return b;
  }
}
