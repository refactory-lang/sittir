import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { False, LiteralType, Null, Number, String, True, UnaryExpression, Undefined } from '../types.js';
import { unary_expression } from './unary-expression.js';
import type { UnaryExpressionOptions } from './unary-expression.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';


class LiteralTypeBuilder extends Builder<LiteralType> {
  private _children: Builder<UnaryExpression | Number | String | True | False | Null | Undefined>[] = [];

  constructor(children: Builder<UnaryExpression | Number | String | True | False | Null | Undefined>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LiteralType {
    return {
      kind: 'literal_type',
      children: this._children[0]!.build(ctx),
    } as LiteralType;
  }

  override get nodeKind(): 'literal_type' { return 'literal_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LiteralTypeBuilder };

export function literal_type(children: Builder<UnaryExpression | Number | String | True | False | Null | Undefined>): LiteralTypeBuilder {
  return new LiteralTypeBuilder(children);
}

export interface LiteralTypeOptions {
  nodeKind: 'literal_type';
  children: Builder<UnaryExpression | Number | String | True | False | Null | Undefined> | UnaryExpressionOptions | StringOptions | (Builder<UnaryExpression | Number | String | True | False | Null | Undefined> | UnaryExpressionOptions | StringOptions)[];
}

export namespace literal_type {
  export function from(input: Omit<LiteralTypeOptions, 'nodeKind'> | Builder<UnaryExpression | Number | String | True | False | Null | Undefined> | UnaryExpressionOptions | StringOptions | (Builder<UnaryExpression | Number | String | True | False | Null | Undefined> | UnaryExpressionOptions | StringOptions)[]): LiteralTypeBuilder {
    const options: Omit<LiteralTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<LiteralTypeOptions, 'nodeKind'>
      : { children: input } as Omit<LiteralTypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<UnaryExpression | Number | String | True | False | Null | Undefined>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'unary_expression': _resolved = unary_expression.from(_ctor); break;
        case 'string': _resolved = string.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new LiteralTypeBuilder(_resolved);
    return b;
  }
}
