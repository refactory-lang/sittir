import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList, FormatSpecifier, Interpolation, PatternList, TypeConversion, Yield } from '../types.js';
import { expression_list } from './expression-list.js';
import type { ExpressionListOptions } from './expression-list.js';
import { pattern_list } from './pattern-list.js';
import type { PatternListOptions } from './pattern-list.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';
import { format_specifier } from './format-specifier.js';
import type { FormatSpecifierOptions } from './format-specifier.js';


class InterpolationBuilder extends Builder<Interpolation> {
  private _expression: Builder<Expression | ExpressionList | PatternList | Yield>;
  private _typeConversion?: Builder<TypeConversion>;
  private _formatSpecifier?: Builder<FormatSpecifier>;

  constructor(expression: Builder<Expression | ExpressionList | PatternList | Yield>) {
    super();
    this._expression = expression;
  }

  typeConversion(value: Builder<TypeConversion>): this {
    this._typeConversion = value;
    return this;
  }

  formatSpecifier(value: Builder<FormatSpecifier>): this {
    this._formatSpecifier = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._expression) parts.push(this.renderChild(this._expression, ctx));
    if (this._typeConversion) parts.push(this.renderChild(this._typeConversion, ctx));
    if (this._formatSpecifier) parts.push(this.renderChild(this._formatSpecifier, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Interpolation {
    return {
      kind: 'interpolation',
      expression: this._expression.build(ctx),
      typeConversion: this._typeConversion ? this._typeConversion.build(ctx) : undefined,
      formatSpecifier: this._formatSpecifier ? this._formatSpecifier.build(ctx) : undefined,
    } as Interpolation;
  }

  override get nodeKind(): 'interpolation' { return 'interpolation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._expression) parts.push({ kind: 'builder', builder: this._expression, fieldName: 'expression' });
    if (this._typeConversion) parts.push({ kind: 'builder', builder: this._typeConversion, fieldName: 'typeConversion' });
    if (this._formatSpecifier) parts.push({ kind: 'builder', builder: this._formatSpecifier, fieldName: 'formatSpecifier' });
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { InterpolationBuilder };

export function interpolation(expression: Builder<Expression | ExpressionList | PatternList | Yield>): InterpolationBuilder {
  return new InterpolationBuilder(expression);
}

export interface InterpolationOptions {
  nodeKind: 'interpolation';
  expression: Builder<Expression | ExpressionList | PatternList | Yield> | ExpressionListOptions | PatternListOptions | YieldOptions;
  typeConversion?: Builder<TypeConversion> | string;
  formatSpecifier?: Builder<FormatSpecifier> | Omit<FormatSpecifierOptions, 'nodeKind'>;
}

export namespace interpolation {
  export function from(options: Omit<InterpolationOptions, 'nodeKind'>): InterpolationBuilder {
    const _raw = options.expression;
    let _ctor: Builder<Expression | ExpressionList | PatternList | Yield>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'expression_list': _ctor = expression_list.from(_raw); break;
        case 'pattern_list': _ctor = pattern_list.from(_raw); break;
        case 'yield': _ctor = yield_.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new InterpolationBuilder(_ctor);
    if (options.typeConversion !== undefined) {
      const _v = options.typeConversion;
      b.typeConversion(typeof _v === 'string' ? new LeafBuilder('type_conversion', _v) : _v);
    }
    if (options.formatSpecifier !== undefined) {
      const _v = options.formatSpecifier;
      b.formatSpecifier(_v instanceof Builder ? _v : format_specifier.from(_v));
    }
    return b;
  }
}
