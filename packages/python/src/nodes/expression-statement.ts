import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Assignment, AugmentedAssignment, Expression, ExpressionStatement, Yield } from '../types.js';
import { assignment } from './assignment.js';
import type { AssignmentOptions } from './assignment.js';
import { augmented_assignment } from './augmented-assignment.js';
import type { AugmentedAssignmentOptions } from './augmented-assignment.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';


class ExpressionStatementBuilder extends Builder<ExpressionStatement> {
  private _children: Builder<Expression | Assignment | AugmentedAssignment | Yield>[] = [];

  constructor(...children: Builder<Expression | Assignment | AugmentedAssignment | Yield>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExpressionStatement {
    return {
      kind: 'expression_statement',
      children: this._children.map(c => c.build(ctx)),
    } as ExpressionStatement;
  }

  override get nodeKind(): 'expression_statement' { return 'expression_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ExpressionStatementBuilder };

export function expression_statement(...children: Builder<Expression | Assignment | AugmentedAssignment | Yield>[]): ExpressionStatementBuilder {
  return new ExpressionStatementBuilder(...children);
}

export interface ExpressionStatementOptions {
  nodeKind: 'expression_statement';
  children?: Builder<Expression | Assignment | AugmentedAssignment | Yield> | AssignmentOptions | AugmentedAssignmentOptions | YieldOptions | (Builder<Expression | Assignment | AugmentedAssignment | Yield> | AssignmentOptions | AugmentedAssignmentOptions | YieldOptions)[];
}

export namespace expression_statement {
  export function from(input: Omit<ExpressionStatementOptions, 'nodeKind'> | Builder<Expression | Assignment | AugmentedAssignment | Yield> | AssignmentOptions | AugmentedAssignmentOptions | YieldOptions | (Builder<Expression | Assignment | AugmentedAssignment | Yield> | AssignmentOptions | AugmentedAssignmentOptions | YieldOptions)[]): ExpressionStatementBuilder {
    const options: Omit<ExpressionStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ExpressionStatementOptions, 'nodeKind'>
      : { children: input } as Omit<ExpressionStatementOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ExpressionStatementBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'assignment': return assignment.from(_v);   case 'augmented_assignment': return augmented_assignment.from(_v);   case 'yield': return yield_.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
