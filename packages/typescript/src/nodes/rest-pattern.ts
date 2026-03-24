import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Identifier, MemberExpression, NonNullExpression, ObjectPattern, RestPattern, SubscriptExpression, Undefined } from '../types.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';
import { subscript_expression } from './subscript-expression.js';
import type { SubscriptExpressionOptions } from './subscript-expression.js';
import { object_pattern } from './object-pattern.js';
import type { ObjectPatternOptions } from './object-pattern.js';
import { array_pattern } from './array-pattern.js';
import type { ArrayPatternOptions } from './array-pattern.js';
import { non_null_expression } from './non-null-expression.js';
import type { NonNullExpressionOptions } from './non-null-expression.js';


class RestPatternBuilder extends Builder<RestPattern> {
  private _children: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>[] = [];

  constructor(children: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('...');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RestPattern {
    return {
      kind: 'rest_pattern',
      children: this._children[0]!.build(ctx),
    } as RestPattern;
  }

  override get nodeKind(): 'rest_pattern' { return 'rest_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '...', type: '...' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { RestPatternBuilder };

export function rest_pattern(children: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>): RestPatternBuilder {
  return new RestPatternBuilder(children);
}

export interface RestPatternOptions {
  nodeKind: 'rest_pattern';
  children: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression> | MemberExpressionOptions | SubscriptExpressionOptions | ObjectPatternOptions | ArrayPatternOptions | NonNullExpressionOptions | (Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression> | MemberExpressionOptions | SubscriptExpressionOptions | ObjectPatternOptions | ArrayPatternOptions | NonNullExpressionOptions)[];
}

export namespace rest_pattern {
  export function from(input: Omit<RestPatternOptions, 'nodeKind'> | Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression> | MemberExpressionOptions | SubscriptExpressionOptions | ObjectPatternOptions | ArrayPatternOptions | NonNullExpressionOptions | (Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression> | MemberExpressionOptions | SubscriptExpressionOptions | ObjectPatternOptions | ArrayPatternOptions | NonNullExpressionOptions)[]): RestPatternBuilder {
    const options: Omit<RestPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<RestPatternOptions, 'nodeKind'>
      : { children: input } as Omit<RestPatternOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'member_expression': _resolved = member_expression.from(_ctor); break;
        case 'subscript_expression': _resolved = subscript_expression.from(_ctor); break;
        case 'object_pattern': _resolved = object_pattern.from(_ctor); break;
        case 'array_pattern': _resolved = array_pattern.from(_ctor); break;
        case 'non_null_expression': _resolved = non_null_expression.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new RestPatternBuilder(_resolved);
    return b;
  }
}
