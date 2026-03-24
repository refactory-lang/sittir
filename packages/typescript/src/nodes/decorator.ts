import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression, Decorator, Identifier, MemberExpression, ParenthesizedExpression } from '../types.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';
import { call_expression } from './call-expression.js';
import type { CallExpressionOptions } from './call-expression.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';


class DecoratorBuilder extends Builder<Decorator> {
  private _children: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>[] = [];

  constructor(children: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('@');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Decorator {
    return {
      kind: 'decorator',
      children: this._children[0]!.build(ctx),
    } as Decorator;
  }

  override get nodeKind(): 'decorator' { return 'decorator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '@', type: '@' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DecoratorBuilder };

export function decorator(children: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>): DecoratorBuilder {
  return new DecoratorBuilder(children);
}

export interface DecoratorOptions {
  nodeKind: 'decorator';
  children: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression> | MemberExpressionOptions | CallExpressionOptions | ParenthesizedExpressionOptions | (Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression> | MemberExpressionOptions | CallExpressionOptions | ParenthesizedExpressionOptions)[];
}

export namespace decorator {
  export function from(input: Omit<DecoratorOptions, 'nodeKind'> | Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression> | MemberExpressionOptions | CallExpressionOptions | ParenthesizedExpressionOptions | (Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression> | MemberExpressionOptions | CallExpressionOptions | ParenthesizedExpressionOptions)[]): DecoratorBuilder {
    const options: Omit<DecoratorOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DecoratorOptions, 'nodeKind'>
      : { children: input } as Omit<DecoratorOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'member_expression': _resolved = member_expression.from(_ctor); break;
        case 'call_expression': _resolved = call_expression.from(_ctor); break;
        case 'parenthesized_expression': _resolved = parenthesized_expression.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new DecoratorBuilder(_resolved);
    return b;
  }
}
