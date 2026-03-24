import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, IfExpression } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { if_expression } from './if-expression.js';
import type { IfExpressionOptions } from './if-expression.js';


class ElseClauseBuilder extends Builder<ElseClause> {
  private _children: Builder<Block | IfExpression>[] = [];

  constructor(children: Builder<Block | IfExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('else');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ElseClause {
    return {
      kind: 'else_clause',
      children: this._children[0]!.build(ctx),
    } as ElseClause;
  }

  override get nodeKind(): 'else_clause' { return 'else_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'else', type: 'else' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ElseClauseBuilder };

export function else_clause(children: Builder<Block | IfExpression>): ElseClauseBuilder {
  return new ElseClauseBuilder(children);
}

export interface ElseClauseOptions {
  nodeKind: 'else_clause';
  children: Builder<Block | IfExpression> | BlockOptions | IfExpressionOptions | (Builder<Block | IfExpression> | BlockOptions | IfExpressionOptions)[];
}

export namespace else_clause {
  export function from(input: Omit<ElseClauseOptions, 'nodeKind'> | Builder<Block | IfExpression> | BlockOptions | IfExpressionOptions | (Builder<Block | IfExpression> | BlockOptions | IfExpressionOptions)[]): ElseClauseBuilder {
    const options: Omit<ElseClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ElseClauseOptions, 'nodeKind'>
      : { children: input } as Omit<ElseClauseOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<Block | IfExpression>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'block': _resolved = block.from(_ctor); break;
        case 'if_expression': _resolved = if_expression.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ElseClauseBuilder(_resolved);
    return b;
  }
}
